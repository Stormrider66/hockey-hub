import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const ChevronRight = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m9 18 6-6-6-6"></path>
      </Icon>
    );
  }
);

ChevronRight.displayName = 'ChevronRight';