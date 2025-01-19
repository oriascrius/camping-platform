'use client';
import RegisterForm from '@/components/auth/RegisterForm';

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex items-center justify-center
                    bg-gradient-to-br from-[#F3F4F6] via-white to-[#E5E7EB]
                    p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md">
        <RegisterForm />
      </div>
    </div>
  );
}