import { forwardRef } from 'react';
import { Icon, IconProps } from '../Icon';

export const GripVertical = forwardRef<SVGSVGElement, IconProps>(
  ({ size = 24, ...props }, ref) => {
    return (
      <Icon ref={ref} size={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <circle cx="9" cy="5" r="1"></circle>
        <circle cx="9" cy="12" r="1"></circle>
        <circle cx="9" cy="19" r="1"></circle>
        <circle cx="15" cy="5" r="1"></circle>
        <circle cx="15" cy="12" r="1"></circle>
        <circle cx="15" cy="19" r="1"></circle>
      </Icon>
    );
  }
);

GripVertical.displayName = 'GripVertical';