import { forwardRef } from 'react';

const Input = forwardRef(({ 
  label, 
  error, 
  helperText, 
  className = '', 
  containerClassName = '',
  required = false,
  variant = 'default', // 'default', 'modern' 
  ...props 
}, ref) => {
  const baseInputClasses = "w-full px-4 py-3 border transition-all duration-200 text-gray-900 placeholder:text-gray-500";
  
  const variantClasses = {
    default: "border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent",
    modern: "border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent"
  };
  
  const errorClasses = error ? "border-red-500 focus:ring-red-500" : "";
  
  const inputClasses = `${baseInputClasses} ${variantClasses[variant]} ${errorClasses} ${className}`;
  
  return (
    <div className={containerClassName}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <input
        ref={ref}
        className={inputClasses}
        {...props}
      />
      
      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}
      
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
