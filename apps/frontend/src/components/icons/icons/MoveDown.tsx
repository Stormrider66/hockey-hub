import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const MoveDown = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M5 3h14"></path>
        <path d="M12 7v14"></path>
        <path d="m18 15-6 6-6-6"></path>
      </Icon>
    );
  }
);

MoveDown.displayName = 'MoveDown';