import util from 'util';
import { parse } from 'querystring';
import rp from 'request-promise-native';

const accessTokenUrl = new URL('https://api.twitter.com/oauth/access_token');
const authorizeUrl = new URL('https://api.twitter.com/oauth/authorize');
const requestTokenUrl = new URL('https://api.twitter.com/oauth/request_token');

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
} = process.env;

export async function accessToken({
  oauth_token,
  oauth_token_secret
}, { oauth_verifier }) {
  const OAuthConfig = {
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    token: oauth_token,
    token_secret: oauth_token_secret,
    verifier: oauth_verifier,
  };

  const req = await rp.post({
    uri: accessTokenUrl,
    oauth: OAuthConfig,
    resolveWithFullResponse: true,
  });

  if (req.body) {
    return parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
}

export async function requestToken(callback) {
  if (!(callback instanceof URL)) {
    throw new TypeError('callback must be of type URL');
  }

  const OAuthConfig = {
    callback: callback.href,
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
  };

  const req = await rp.post({
    uri: requestTokenUrl,
    oauth: OAuthConfig,
    resolveWithFullResponse: true,
  });
  if (req.body) {
    return parse(req.body);
  } else {
    throw new Error('Cannot get an OAuth request token');
  }
}

export const getAuthorizeUrl = (requestToken) => {
  if (!requestToken.oauth_token) {
    throw new TypeError('getAuthorizeURL: missing field oauth_token in requestToken');
  }

  const url = new URL(`${authorizeUrl}`);
  url.searchParams.append('oauth_token', requestToken.oauth_token);
  return url;
};
