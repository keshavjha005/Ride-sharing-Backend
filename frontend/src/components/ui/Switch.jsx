import React from 'react';

const Switch = ({ checked, onChange, onCheckedChange, className = '', disabled = false, ...props }) => {
  const handleChange = (e) => {
    if (onCheckedChange) {
      onCheckedChange(!checked);
    } else if (onChange) {
      onChange(e);
    }
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input ${className}`}
      onClick={handleChange}
      {...props}
    >
      <span
        className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-5 data-[state=unchecked]:translate-x-0`}
      />
    </button>
  );
};

export { Switch }; 