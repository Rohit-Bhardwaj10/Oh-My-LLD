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

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1">{children}</div>
      <footer className="w-full border-t border-white/5 bg-[#0a0a0a] py-3">
        <p className="text-center text-white/25 text-xs tracking-widest font-mono">
          Built by{" "}
          <a
            href="https://github.com/Rohit-Bhardwaj10"
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/40 hover:text-white/70 transition-colors underline underline-offset-4"
          >
            Rohit Bhardwaj
          </a>
        </p>
      </footer>
    </div>
  );
}
