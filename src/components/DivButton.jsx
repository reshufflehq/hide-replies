import React from 'react';

import '../styles/DivButton.css';

export const DivButton = ({
  children,
  className,
  ...rest
}) => {
  const merged = `div-button ${className || ''}`;
  return (
    <div
      role='button'
      aria-pressed='false'
      className={merged}
      {...rest}
    >
      {children}
    </div>
  );
};
