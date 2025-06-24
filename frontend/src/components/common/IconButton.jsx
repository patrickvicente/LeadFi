import React from 'react';

const IconButton = ({ 
  icon: Icon, 
  onClick, 
  variant = 'default', 
  size = 'md',
  title,
  disabled = false,
  className = ''
}) => {
  const baseClasses = "p-2 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background";
  
  const variantClasses = {
    edit: "text-highlight3 hover:text-highlight3/80 hover:bg-gray-700 focus:ring-highlight3",
    delete: "text-highlight2 hover:text-highlight2/80 hover:bg-gray-700 focus:ring-highlight2",
    view: "text-highlight1 hover:text-highlight1/80 hover:bg-gray-700 focus:ring-highlight1",
    convert: "text-highlight5 hover:text-highlight5/80 hover:bg-gray-700 focus:ring-highlight5",
    save: "text-highlight5 hover:text-highlight5/80 hover:bg-gray-700 focus:ring-highlight5",
    cancel: "text-highlight2 hover:text-highlight2/80 hover:bg-gray-700 focus:ring-highlight2",
    default: "text-text hover:text-gray-300 hover:bg-gray-700 focus:ring-gray-500"
  };

  const sizeClasses = {
    sm: "p-1",
    md: "p-2", 
    lg: "p-3"
  };

  const iconSizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6"
  };

  const classes = [
    baseClasses,
    variantClasses[variant] || variantClasses.default,
    sizeClasses[size],
    disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer",
    className
  ].join(" ");

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={classes}
      title={title}
      type="button"
    >
      <Icon className={iconSizes[size]} />
    </button>
  );
};

export default IconButton; 