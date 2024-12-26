'use client';
import { SessionProvider } from 'next-auth/react';

export default function BackLayout({ children }) {
  return (
    <div className="fixed inset-0 w-full h-full bg-gray-100 overflow-auto">
      <SessionProvider>
        {children}
      </SessionProvider>
    </div>
  );
}