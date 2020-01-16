import React, { useState } from 'react';

import '../styles/RevealText.css';

export const RevealText = ({ text }) => {
  const [isHidden, setHidden] = useState(true);
  const blockerCls = isHidden ?
    'reveal-text-blocker' : 'reveal-text-remove';

  const handleReveal = (evt) => {
    evt.preventDefault();
    setHidden(!isHidden);
  }
  return (
    <div
      className='reveal-text-wrapper'
      onClick={handleReveal}
    >
      <span className={isHidden ? 'reveal-text-hidden' : undefined}>
        {text}
      </span>
      <div className={blockerCls}>
        Click to reveal
      </div>
    </div>
  );
};
