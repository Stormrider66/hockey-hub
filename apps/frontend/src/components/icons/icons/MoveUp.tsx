import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const MoveUp = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="m18 9 -6-6-6 6"></path>
        <path d="M12 3v14"></path>
        <path d="M5 21h14"></path>
      </Icon>
    );
  }
);

MoveUp.displayName = 'MoveUp';