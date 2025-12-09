import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const Gauge = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m12 14 4-4"></path>
        <path d="M3.34 19a10 10 0 1 1 17.32 0"></path>
      </Icon>
    );
  }
);

Gauge.displayName = 'Gauge';