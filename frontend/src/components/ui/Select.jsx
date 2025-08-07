import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

const Select = ({ children, value, onValueChange, placeholder = "Select an option", className = '', disabled = false, ...props }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const selectRef = useRef(null);

  // Find the selected option based on value
  const findSelectedOption = () => {
    if (!children) return null;
    
    const options = Array.isArray(children) ? children : [children];
    return options.find(option => option.props.value === value);
  };

  useEffect(() => {
    setSelectedOption(findSelectedOption());
  }, [value, children]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (optionValue, optionLabel) => {
    setSelectedOption({ value: optionValue, label: optionLabel });
    if (onValueChange) {
      onValueChange(optionValue);
    }
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Clone children and pass handleSelect function
  const renderChildren = () => {
    if (!children) return null;
    
    const options = Array.isArray(children) ? children : [children];
    return options.map((child, index) => {
      if (child.type === SelectItem) {
        return React.cloneElement(child, {
          key: index,
          onClick: () => handleSelect(child.props.value, child.props.children)
        });
      }
      return child;
    });
  };

  return (
    <div ref={selectRef} className={`relative ${className}`} {...props}>
      <button
        type="button"
        onClick={toggleDropdown}
        disabled={disabled}
        className={`
          flex h-10 w-full items-center justify-between rounded-md 
          border border-input bg-input-bg px-3 py-2 text-sm 
          text-input-text placeholder:text-input-placeholder
          focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 
          disabled:cursor-not-allowed disabled:opacity-50
          hover:border-primary/50 transition-colors
          ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
        `}
      >
        <span className="truncate">
          {selectedOption ? selectedOption.props.children : placeholder}
        </span>
        <ChevronDown 
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-background-secondary border border-border rounded-md shadow-modal">
          <div className="py-1 max-h-60 overflow-auto">
            {renderChildren()}
          </div>
        </div>
      )}
    </div>
  );
};

const SelectTrigger = ({ children, className = '', ...props }) => {
  return (
    <button
      className={`flex h-10 w-full items-center justify-between rounded-md border border-input bg-input-bg px-3 py-2 text-sm text-input-text placeholder:text-input-placeholder focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectValue = ({ placeholder, children, ...props }) => {
  return (
    <span {...props}>
      {children || placeholder}
    </span>
  );
};

const SelectContent = ({ children, className = '', ...props }) => {
  return (
    <div
      className={`relative z-50 min-w-[8rem] overflow-hidden rounded-md border bg-background-secondary text-text-primary shadow-modal ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

const SelectItem = ({ children, value, className = '', onClick, ...props }) => {
  return (
    <div
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-2 px-3 text-sm outline-none hover:bg-background-tertiary focus:bg-background-tertiary transition-colors ${className}`}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem }; 