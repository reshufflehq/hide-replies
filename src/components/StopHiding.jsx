import React, { useEffect, useState } from 'react';

import { RenderedTweet } from './RenderedTweet';
import { DivButton } from './DivButton';

import stopSign from '../stop-sign.png';

import '../styles/StopHiding.css';

export function StopHiding({ stopHidingHandler }) {
  const [replies, setReplies] = useState([]);
  useEffect(() => {
    let relevant = true;
    let outstanding = false;
    async function getReplies() {
      if (outstanding === true) return;
      try {
        outstanding = true;
        const response = await fetch('/get-replies');
        const updatedReplies = await response.json();
        if (relevant && replies.length < updatedReplies.length) {
          setReplies(updatedReplies);
        }
      } catch (err) {}
      outstanding = false;
    }

    const updateCheck = setInterval(getReplies, 3000);
    // call it once manually so initial replies display
    // reponsively
    getReplies();

    return () => {
      relevant = false;
      clearInterval(updateCheck);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTweet = (newTweet) => {
    const copy = [...replies];
    setReplies(copy.map((tweet) => {
      if (tweet.id === newTweet.id) {
        return newTweet;
      }
      return tweet;
    }));
  };

  return (
    <div className='stop-hiding-container'>
      <div className='stop-hiding-button-wrapper'>
        <DivButton
          onClick={stopHidingHandler}
          onKeyDown={stopHidingHandler}
          className='stop-button'
        >
          <div className='stop-sign-wrapper'>
            <img
              alt='Stop sign'
              src={stopSign}
              className='stop-sign'
            />
            <span className='stop-sign-text'>
              STOP
            </span>
          </div>
          <span>
            Click here to stop hiding your replies
          </span>
        </DivButton>
      </div>
      <div className='rendered-tweets'>
        {
          replies.map((tweet) =>
            <RenderedTweet
              key={tweet.id}
              setTweet={setTweet}
              tweet={tweet}
            />
          )
        }
      </div>
    </div>
  )
}
