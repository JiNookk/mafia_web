'use client';

import { Toaster as Sonner } from 'sonner';

export const Toaster = () => {
  return (
    <Sonner
      position="top-center"
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        style: {
          background: 'var(--card)',
          color: 'var(--foreground)',
          border: '1px solid var(--border)',
        },
      }}
    />
  );
};
