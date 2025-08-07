import React from 'react';

const Tabs = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={className}>
      {children}
    </div>
  );
};

const TabsList = ({ children, className = '' }) => {
  return (
    <div className={`flex space-x-1 p-1 ${className}`}>
      {children}
    </div>
  );
};

const TabsTrigger = ({ value, children, className = '', ...props }) => {
  return (
    <button
      className={`flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className = '' }) => {
  return (
    <div className={`mt-4 ${className}`}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent }; 