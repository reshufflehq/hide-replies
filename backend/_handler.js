import express from 'express';
import cookieSession from 'cookie-session';
import cookieParser from 'cookie-parser';

import { Autohook, validateWebhook } from 'twitter-autohook';

import { update, get, find, Q, remove } from '@reshuffle/db';
import { defaultHandler } from '@reshuffle/server-function';

import { moderate, parseEvent } from './twitter';
import { getUrl } from './getUrl';

import {
  requestToken,
  accessToken,
  getAuthorizeUrl,
} from './oauth';

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  COOKIE_SIGNING_SECRET,
} = process.env;

const userPrefix = 'user_';
const repliesPrefix = 'replies_';

const baseUrl = getUrl();
const webhookRoute = '/twitter-event';
const webhookUrl = `${baseUrl}${webhookRoute}`;
const callbackUrl = new URL(`${baseUrl}/oauth-callback`);

// If these words are used in a reply, the reply will be
// flagged and sent to the client.
const toxicWords = ['toxic'];

const autohookConfig = {
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  env: process.env.TWITTER_ENV,
};

const webhook = new Autohook(autohookConfig);

// Remove existing data before starting the webhook
webhook.removeWebhooks().then(() =>
  webhook.start(webhookUrl))

const app = express();
app.set('trust proxy', true);
app.use(express.json());
app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: [COOKIE_SIGNING_SECRET],
  maxAge: 15 * 60 * 1000, // 15 minutes
}))
app.set('json spaces', 2)

// Endpoint for step 1 of the oauth dance.
app.get('/oauth', async (req, res) => {
  res.clearCookie('request_token');
  try {
    const reqTk = await requestToken(callbackUrl);
    res.cookie('request_token', reqTk);
    res.redirect(getAuthorizeUrl(reqTk));
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

// Endpoint for step 2 of the oauth dance.
app.get('/oauth-callback', async (req, res) => {
  if (!req.query.oauth_verifier) {
    console.error('OAuth callback: no oauth_verifier');
    res.redirect('/');
    return;
  }

  try {
    const reqTk = req.cookies.request_token;
    const accessTk = await accessToken(reqTk, req.query);
    const {
      user_id,
      screen_name,
      oauth_token,
      oauth_token_secret,
    } = accessTk;
    const token = { ...accessTk };
    await remove(`${repliesPrefix}${user_id}`);
    await update(`${userPrefix}${user_id}`, () => token);
    try {
      await webhook.subscribe({ oauth_token, oauth_token_secret });
    } catch (err) {
      console.error(err);
    }
    req.session = token;
    res.redirect(`/?user_id=${user_id}&name=${screen_name}`);
  } catch (e) {
    console.error(e);
    res.sendStatus(400);
  }
});

// This endpoint handles incoming webhook events from
// Twitter. It also needs to handle the initial challenge
// using the included CRC token and our consumer secret.
app.all(webhookRoute, async (req, res) => {
  if (req.query.crc_token) {
    res.json(validateWebhook(req.query.crc_token, {
      consumer_secret: TWITTER_CONSUMER_SECRET
    }));
  } else {
    res.sendStatus(200);
    const tweet = await parseEvent(req.body, toxicWords);
    if (tweet !== undefined) {
      await update(`${repliesPrefix}${req.body.for_user_id}`,
        (existing = []) => [...existing, tweet]);
    }
  }
});

// Hides an existing reply to the users tweet.
app.all('/hide-reply', async (req, res) => {
  const tweetId = req.body.id;
  if (!tweetId) {
    res.status(400).json('No tweet id included in request')
    return;
  }

  const {
    user_id,
    oauth_token,
    oauth_token_secret,
  } = req.session;

  const tweets = await get(`${repliesPrefix}${user_id}`) || [];
  const tweet = tweets.filter(({ id }) => id === tweetId)[0];

  if (!tweet) {
    res.status(400).json('No tweet found with that id')
    return;
  }

  if (tweet.hidden) {
    res.status(200).json(tweet);
    return;
  }

  try {
    await moderate(tweet, {
      consumer_key: TWITTER_CONSUMER_KEY,
      consumer_secret: TWITTER_CONSUMER_SECRET,
      token: oauth_token,
      token_secret: oauth_token_secret,
    });
  } catch (err) {}
  const saved = await update(`${repliesPrefix}${user_id}`, (old) => {
    return old.map((origTweet) => {
      const copiedTweet = { ...origTweet };
      if (copiedTweet.id === tweetId) {
        copiedTweet.hidden = true;
      }
      return copiedTweet;
    });
  });
  res.status(200).json(
    saved.filter(({ id }) => id === tweetId)[0]);
});

// Retrieve all stored replies to the users tweets.
// Returns an empty array if no replies are stored.
app.all('/get-replies', async (req, res) => {
  const userId = req.session.user_id;
  const replies = await get(`${repliesPrefix}${userId}`) || [];
  return res.status(200).json(replies);
});

// Unsubscribe from the users event stream. Also
// clean up any stored tweets and nullify the users
// request session.
app.all('/disconnect', async (req, res) => {
  const { user_id } = req.session;
  try {
    await webhook.unsubscribe(user_id);
  } catch (err) {
    console.error(err);
  }
  await remove(`${userPrefix}${user_id}`);
  await remove(`${repliesPrefix}${user_id}`);
  req.session = null;
  res.status(200).json('ok');
});

app.use(defaultHandler);

export default app;
