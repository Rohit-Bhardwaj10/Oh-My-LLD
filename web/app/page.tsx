"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function Home() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh(); // Or redirect if necessary
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="px-8 py-6 border-b border-zinc-200 bg-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-zinc-900 tracking-tight">LLD Practice Platform</span>
          <nav className="flex items-center gap-6 text-sm font-medium">
            {isPending ? (
              <span className="text-zinc-400">...</span>
            ) : session ? (
              <>
                <Link href="/problems" className="text-zinc-500 hover:text-zinc-900 transition-colors">Problems</Link>
                <button onClick={handleSignOut} className="text-zinc-500 hover:text-zinc-900 transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-zinc-500 hover:text-zinc-900 transition-colors">Log In</Link>
                <Link href="/signup" className="text-zinc-500 hover:text-zinc-900 transition-colors">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto py-24 px-8">
        <div className="space-y-6 max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">
            Master Low-Level Design through deliberate practice.
          </h1>
          <p className="text-lg text-zinc-600 leading-relaxed">
            A serious tool for practicing object-oriented design and system architecture. 
            No passive reading—just you, a prompt, and immediate feedback from an AI evaluator.
          </p>
        </div>

        <div className="mt-16 border border-zinc-200 rounded bg-white overflow-hidden shadow-sm">
          <div className="bg-zinc-100 border-b border-zinc-200 px-6 py-3 font-mono text-xs text-zinc-500 uppercase tracking-wider">
            Practice Loop
          </div>
          <div className="p-8 space-y-8 font-mono text-sm text-zinc-700">
            <div className="flex items-start gap-4">
              <span className="text-amber-600 font-bold shrink-0">01</span>
              <div>
                <strong className="text-zinc-900">Select Problem</strong>
                <p className="mt-1 text-zinc-500">Pick a canonical LLD question (e.g. Parking Lot, Elevator System).</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-amber-600 font-bold shrink-0">02</span>
              <div>
                <strong className="text-zinc-900">Draft Solution</strong>
                <p className="mt-1 text-zinc-500">Define requirements, design core classes, and analyze scaling trade-offs.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-amber-600 font-bold shrink-0">03</span>
              <div>
                <strong className="text-zinc-900">Submit for Evaluation</strong>
                <p className="mt-1 text-zinc-500">Receive strict, criterion-based feedback from an LLM.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <span className="text-amber-600 font-bold shrink-0">04</span>
              <div>
                <strong className="text-zinc-900">Iterate</strong>
                <p className="mt-1 text-zinc-500">Review concerns, adjust your approach, and try again.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16">
          <Link 
            href="/problems"
            className="inline-flex items-center justify-center h-10 px-6 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors"
          >
            View Problems
          </Link>
        </div>
      </main>
    </div>
  );
}
