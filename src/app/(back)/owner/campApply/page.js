'use client';
import { Suspense } from 'react';
import CampApplyForm from '@/components/owner/campApply/CampApplyForm';

export default function CampApplyPage() {
  const loading = (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#6B8E7B]" />
    </div>
  );

  return (
    <div className="min-h-screen mt-8">
    {/* 在等待內容加載時顯示備用內容（fallback） */}
      <Suspense fallback={loading}>
        <div className="p-8">
          <h1 className="text-2xl font-bold text-[#2C4A3B] mb-8">營地申請</h1>
          <CampApplyForm />
        </div>
      </Suspense>
    </div>
  );
} 