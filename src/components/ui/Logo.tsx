import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  /** Pass title="" to make the icon decorative. */
  title?: string;
}

const sizeClasses: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'h-6',
  md: 'h-8',
  lg: 'h-12',
  xl: 'h-16',
};

const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  title = 'ZNTEQR',
}) => (
  <img
    src="/images/brand/icons/ZNTEQR-Icon-512.png"
    alt={title}
    className={`${sizeClasses[size]} w-auto ${className}`}
  />
);

export default Logo;
