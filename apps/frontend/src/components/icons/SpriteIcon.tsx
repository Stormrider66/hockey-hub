import React from 'react';
import { IconProps, IconName } from './types';
import { defaultIconProps } from './Icon';

interface SpriteIconProps extends IconProps {
  name: IconName;
}

export const SpriteIcon: React.FC<SpriteIconProps> = ({ 
  name, 
  size, 
  color, 
  width, 
  height, 
  className,
  ...props 
}) => {
  const iconSize = size || width || defaultIconProps.width;
  
  return (
    <svg
      width={iconSize}
      height={iconSize}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color: color || props.style?.color, ...props.style }}
      {...props}
    >
      <use href={`#icon-${name}`} />
    </svg>
  );
};