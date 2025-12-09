import React from 'react';
import { Icon, IconProps } from '../Icon';

export const Circle: React.FC<IconProps> = (props) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
  </Icon>
);