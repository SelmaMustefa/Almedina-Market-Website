import React from 'react';
import logoSrc from '../../assets/images/logo.png';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
};

export const Logo: React.FC<LogoProps> = ({ size = 'md', className = '' }) => (
  <img
    src={logoSrc}
    alt="Almedina Market"
    className={`${sizeClasses[size]} object-contain shrink-0 ${className}`}
  />
);
