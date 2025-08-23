'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function CreatorProfileRedirect() {
  const router = useRouter();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      router.replace(`/creator/${id}`);
    }
  }, [id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-white to-pink-50">
      <div className="w-8 h-8 border-2 border-purple-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

