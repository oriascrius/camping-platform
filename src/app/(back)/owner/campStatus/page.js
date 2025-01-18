'use client';
import { Suspense } from 'react';
import CampList from '@/components/owner/campStatus/CampList';

export default function CampsPage() {
  const loading = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
    </div>
  );

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-8">營地審核狀態</h1>
        <Suspense fallback={loading}>
          <CampList />
        </Suspense>
      </div>
    </div>
  );
} 