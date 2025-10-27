'use client';

import { useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const tokenFromUrl = searchParams.get('token');

    if (tokenFromUrl) {
      // Store token as 'accessToken' to match what the dashboard expects
      localStorage.setItem('accessToken', tokenFromUrl);

      // Redirect to dashboard
      router.push('/');
    } else {
      // If no token, redirect to login
      router.push('/login');
    }
  }, [searchParams, router]);

  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="text-xl">Redirecting to dashboard...</div>
    </main>
  );
}
