import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ArrowRight = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M5 12h14"></path>
        <path d="m12 5 7 7-7 7"></path>
      </Icon>
    );
  }
);

ArrowRight.displayName = 'ArrowRight';