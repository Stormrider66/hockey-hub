import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronLeft = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m15 18-6-6 6-6"></path>
      </Icon>
    );
  }
);

ChevronLeft.displayName = 'ChevronLeft';