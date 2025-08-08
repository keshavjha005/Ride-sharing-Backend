import React from 'react';

const Badge = ({ children, variant = 'default', className = '', ...props }) => {
  const baseClasses = 'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2';
  
  const variantClasses = {
    default: 'bg-primary text-white hover:bg-primary-dark',
    secondary: 'bg-background-secondary text-text-primary hover:bg-background-tertiary',
    destructive: 'bg-error text-white hover:bg-red-600',
    outline: 'text-text-primary border border-border hover:bg-background-tertiary hover:text-text-primary',
    success: 'bg-success text-white hover:bg-green-600',
    warning: 'bg-warning text-black hover:bg-yellow-600'
  };
  
  const classes = `${baseClasses} ${variantClasses[variant]} ${className}`;
  
  return (
    <span className={classes} {...props}>
      {children}
    </span>
  );
};

export { Badge }; 