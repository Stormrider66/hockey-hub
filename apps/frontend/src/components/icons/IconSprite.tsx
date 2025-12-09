import React from 'react';

// Icon sprite definition with all icon paths
export const IconSprite: React.FC = () => (
  <svg style={{ display: 'none' }}>
    <defs>
      <symbol id="icon-plus" viewBox="0 0 24 24">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </symbol>
      
      <symbol id="icon-save" viewBox="0 0 24 24">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
      </symbol>
      
      <symbol id="icon-edit" viewBox="0 0 24 24">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
      </symbol>
      
      <symbol id="icon-trash2" viewBox="0 0 24 24">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        <line x1="10" y1="11" x2="10" y2="17" />
        <line x1="14" y1="11" x2="14" y2="17" />
      </symbol>
      
      <symbol id="icon-download" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </symbol>
      
      <symbol id="icon-upload" viewBox="0 0 24 24">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </symbol>
      
      <symbol id="icon-check-circle" viewBox="0 0 24 24">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </symbol>
      
      <symbol id="icon-alert-circle" viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </symbol>
      
      <symbol id="icon-chevron-down" viewBox="0 0 24 24">
        <polyline points="6 9 12 15 18 9" />
      </symbol>
      
      <symbol id="icon-chevron-up" viewBox="0 0 24 24">
        <polyline points="18 15 12 9 6 15" />
      </symbol>
    </defs>
  </svg>
);

// SpriteIcon component that uses the sprite
interface SpriteIconProps extends React.SVGProps<SVGSVGElement> {
  name: string;
  size?: 16 | 20 | 24 | number;
  color?: string;
  className?: string;
}

export const SpriteIcon: React.FC<SpriteIconProps> = ({
  name,
  size = 24,
  color = 'currentColor',
  className = '',
  ...props
}) => (
  <svg
    width={size}
    height={size}
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <use href={`#icon-${name}`} />
  </svg>
);