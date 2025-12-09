import React from 'react';
import { Icon, IconProps } from '../Icon';

export const Keyboard: React.FC<IconProps> = (props) => {
  return (
    <Icon {...props}>
      <rect x="2" y="4" width="20" height="16" rx="2" ry="2" />
      <path d="M6 8h.001M10 8h.001M14 8h.001M18 8h.001M6 12h.001M10 12h.001M14 12h.001M18 12h.001M6 16h8" />
    </Icon>
  );
};