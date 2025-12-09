import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Grid3X3 = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <rect width="18" height="18" x="3" y="3" rx="2"></rect>
        <path d="M3 9h18"></path>
        <path d="M3 15h18"></path>
        <path d="M9 3v18"></path>
        <path d="M15 3v18"></path>
      </Icon>
    );
  }
);

Grid3X3.displayName = 'Grid3X3';