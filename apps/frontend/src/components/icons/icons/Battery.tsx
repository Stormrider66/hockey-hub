import React from 'react';
import { Icon } from '../Icon';
import type { IconProps } from '../Icon';

export const Battery = React.forwardRef<SVGSVGElement, IconProps>((props, ref) => (
  <Icon ref={ref} {...props}>
    <rect x="2" y="6" width="18" height="12" rx="2" ry="2"/>
    <rect x="22" y="9" width="2" height="6" rx="1" ry="1"/>
  </Icon>
));

Battery.displayName = 'Battery';