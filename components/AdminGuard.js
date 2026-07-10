'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function AdminGuard({ children }) {
  const { user, isHydrated } = useStore();
  const router = useRouter();

  useEffect(() => {
    if (isHydrated) {
      if (!user || user.role !== 'admin') {
        router.push('/login?admin=true');
      }
    }
  }, [user, isHydrated, router]);

  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return null; // will redirect
  }

  return children;
}
