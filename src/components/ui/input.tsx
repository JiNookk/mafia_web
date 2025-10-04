import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = ({ className = '', ...props }: InputProps) => {
  return (
    <input
      className={`px-4 py-2 rounded-lg border outline-none transition-all ${className}`}
      {...props}
    />
  );
};
