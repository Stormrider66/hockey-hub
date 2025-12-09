import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Loader2 = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
      </Icon>
    );
  }
);

Loader2.displayName = 'Loader2';