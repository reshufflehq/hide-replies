import rp from 'request-promise-native';

// Hides the given tweet using the user-specific
// oauth credentials
export const moderate = async (tweet, oauth) => {
  const id = tweet.id_str;
  if (!id) {
    throw new TypeError('Invalid Tweet ID.');
  }

  if (!oauth) {
    throw new Error('No oauth credentials provided');
  }

  const config = {
    url: `https://api.twitter.com/labs/1/tweets/${id}/hidden`,
    json: true,
    body: { hidden: true },
    headers: {
      'User-Agent': 'HideRepliesReshuffle',
    },
    oauth: oauth,
    resolveWithFullResponse: true,
  };

  const { body } = await rp.put(config);
  return body.status && body.status === 'success';
};

export const parseEvent = async (event, toxicWords) => {
  if (!Array.isArray(event.tweet_create_events)) {
    return;
  }

  const tweet = event.tweet_create_events[0];
  const text = tweet.text;
  try {
    const someToxicWord = toxicWords.some((word) =>
      text.includes(word));

    if (someToxicWord) {
      const url = new URL('https://publish.twitter.com/oembed');
      url.searchParams.append('url', `https://twitter.com/${tweet.in_reply_to_screen_name}/status/${tweet.in_reply_to_status_id_str}`);
      const originalTweet = await rp.get({
        url: url,
        json: true,
        resolveWithFullResponse: true,
      });
      tweet.original_tweet = originalTweet.body.html;
      return tweet;
    }
  } catch (e) {
    console.error('Error while scoring Tweet:', e);
  }
  return undefined;
};
