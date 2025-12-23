import React from 'react';

export interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: 16 | 20 | 24 | number;
  color?: string;
  className?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  size = 24, 
  color = 'currentColor',
  className = '',
  children,
  ...props 
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {children}
    </svg>
  );
};

// Create icon helper function that wraps lucide icons or custom SVG content
export const createIcon = (
  iconOrConfig: React.FC<any> | { displayName?: string; viewBox?: string; path: React.ReactNode } | React.ReactNode,
  displayName?: string
) => {
  // If it's a function component (Lucide icon)
  if (typeof iconOrConfig === 'function') {
    const LucideIcon = iconOrConfig;
    const IconComponent: React.FC<IconProps> = (props) => (
      <LucideIcon {...props} />
    );
    IconComponent.displayName = displayName || LucideIcon.displayName || 'Icon';
    return IconComponent;
  }

  // If it's a custom SVG config object with path property
  if (iconOrConfig && typeof iconOrConfig === 'object' && 'path' in iconOrConfig) {
    const config = iconOrConfig as { displayName?: string; viewBox?: string; path: React.ReactNode };
    const IconComponent: React.FC<IconProps> = (props) => (
      <Icon {...props} viewBox={config.viewBox}>
        {config.path}
      </Icon>
    );
    IconComponent.displayName = config.displayName || displayName || 'Icon';
    return IconComponent;
  }

  // If it's direct JSX content (React element/fragment)
  const path = iconOrConfig as React.ReactNode;
  const IconComponent: React.FC<IconProps> = (props) => (
    <Icon {...props}>
      {path}
    </Icon>
  );
  IconComponent.displayName = displayName || 'Icon';
  return IconComponent;
};

export const defaultIconProps = {
  width: 24,
  height: 24,
};