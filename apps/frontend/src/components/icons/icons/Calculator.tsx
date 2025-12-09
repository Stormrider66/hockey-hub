import React from 'react';
import { createIcon } from '../Icon';

export const Calculator = createIcon(
  <>
    <rect x="4" y="2" width="16" height="20" rx="2"/>
    <line x1="8" x2="16" y1="6" y2="6"/>
    <line x1="8" x2="16" y1="10" y2="10"/>
    <line x1="8" x2="16" y1="14" y2="14"/>
    <line x1="8" x2="16" y1="18" y2="18"/>
  </>,
  'Calculator'
);