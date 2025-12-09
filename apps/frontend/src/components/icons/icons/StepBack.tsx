import React from 'react';
import { IconProps } from '../Icon';

export const StepBack: React.FC<IconProps> = (props) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    {...props}
  >
    <polygon points="18 17 10 12 18 7 18 17" />
    <rect x="5" y="5" width="2" height="14" />
  </svg>
);