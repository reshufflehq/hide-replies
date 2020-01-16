import React, { useState } from 'react';

import Loading from 'react-simple-loading';

import { RevealText } from './RevealText';

import '../styles/RenderedTweet.css';

const parseOriginalTweet = (body) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(body, 'text/html');
  return doc.querySelector('blockquote p').innerText || '';
}

export const RenderedTweet = ({
  tweet,
  setTweet,
}) => {
  const [loading, setLoading] = useState(false);
  const now = new Date();
  const formattedTime =
    new Intl.DateTimeFormat(navigator.language, {
      hour: 'numeric',
      minute: 'numeric',
    }).format(now);

  const originalTweet = parseOriginalTweet(tweet.original_tweet);

  const handleHide = async (evt) => {
    evt.stopPropagation();
    setLoading(true);
    try {
      const response = await fetch('/hide-reply', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: tweet.id }),
        json: true,
      });
      setTweet(await response.json());
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }

  const LoadOrHide = ({ hidden, isLoading }) => {
    if (isLoading) {
      return <Loading/>
    } else if (hidden) {
      return 'Tweet hidden!';
    }
    return 'Hide this tweet';
  };

  return (
    <div className='rendered-tweet-wrapper'>
      <div className='rendered-tweet'>
        <p>
          <a
            rel='noopener noreferrer'
            target='_blank'
            href={`https://twitter.com/${tweet.user.name}`}
          >
            {formattedTime} @{tweet.user.name}
          </a>’s reply to:
        </p>
        <p>"{originalTweet}"</p>
        <RevealText text={tweet.text}/>
        <p>
          <a
            target='_blank'
            rel='noopener noreferrer'
            href={`https://twitter.com/${tweet.user.name}/status/${tweet.id_str}`}
          >
            Show reply on Twitter
          </a>
        </p>
      </div>
      <div
        className='rendered-tweet-detail'
        onClick={handleHide}
      >
        <LoadOrHide
          hidden={tweet.hidden}
          isLoading={loading}
        />
      </div>
    </div>
  );
};
