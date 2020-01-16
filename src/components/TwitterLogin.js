import React from 'react';

import { DivButton } from './DivButton';

import twitterLogo from '../twitter-logo.svg';
import reshuffleLogo from '../reshuffle-logo.svg';

import '../styles/TwitterLogin.css';

export function TwitterLogin() {
  const handlePress = (e) => {
    e.preventDefault();
    window.location.href = '/oauth';
  };
  return (
    <DivButton
      onClick={handlePress}
      onKeyDown={handlePress}
    >
      <div className='login-button-images'>
        <img
          alt='Reshuffle logo'
          src={reshuffleLogo}
          className='reshuffle-logo'
        />
        +
        <img alt='Twitter logo' src={twitterLogo}/>
      </div>
      <span>
        Start hiding your replies
      </span>
    </DivButton>
  );
}
