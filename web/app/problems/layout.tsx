'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { authClient } from '@/lib/auth-client';

export default function ProblemsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/login');
    }
  }, [isPending, session, router]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <span className="text-zinc-500 font-mono text-sm">Authenticating...</span>
      </div>
    );
  }

  if (!session) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
}
