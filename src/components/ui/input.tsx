import React from 'react';

export const Input = ({ className = '', ...props }: React.InputHTMLAttributes<HTMLInputElement>) => {
  return (
    <input
      className={`px-4 py-2 rounded-lg border outline-none transition-all ${className}`}
      {...props}
    />
  );
};
