import React from 'react';

const Button = ({ 
  children, 
  variant = 'default', 
  size = 'default', 
  className = '', 
  disabled = false,
  ...props 
}) => {
  const baseClasses = 'inline-flex items-center justify-center rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
  
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary-dark shadow-sm',
    destructive: 'bg-error text-white hover:bg-red-600 shadow-sm',
    outline: 'border border-border bg-background-secondary text-text-primary hover:bg-background-tertiary hover:border-primary',
    secondary: 'bg-background-secondary text-text-primary hover:bg-background-tertiary shadow-sm',
    ghost: 'text-text-secondary hover:text-text-primary hover:bg-background-tertiary',
    link: 'text-primary underline-offset-4 hover:underline hover:text-primary-dark'
  };
  
  const sizeClasses = {
    default: 'h-10 py-2 px-4',
    sm: 'h-9 px-3 rounded-md text-xs',
    lg: 'h-11 px-8 rounded-md',
    icon: 'h-10 w-10'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`;
  
  return (
    <button className={classes} disabled={disabled} {...props}>
      {children}
    </button>
  );
};

export { Button }; 