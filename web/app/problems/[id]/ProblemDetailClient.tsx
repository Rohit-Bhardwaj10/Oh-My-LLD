'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { startAttempt } from './actions';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  constraints: string[];
}

interface ProblemDetailClientProps {
  problem: Problem;
  initialAttempts: any[];
}

export function ProblemDetailClient({ problem, initialAttempts }: ProblemDetailClientProps) {
  const [isPending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState<any[]>(initialAttempts);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/api/attempts?problemId=${problem.id}`, {
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.attempts) {
          setAttempts(data.attempts);
        }
      })
      .catch(console.error)
      .finally(() => setIsLoadingHistory(false));
  }, [problem.id]);

  const completedAttempts = attempts.filter((a) => a.status === 'COMPLETED');

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="px-8 py-4 border-b border-zinc-200 bg-white flex items-center justify-between">
        <Link
          href="/problems"
          className="inline-flex items-center gap-2 text-zinc-500 hover:text-zinc-900 text-sm transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Problems
        </Link>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto py-8 px-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-12">
        {/* Left Column: Problem Spec */}
        <div className="space-y-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
              {problem.title}
            </h1>
            <p className="text-sm text-zinc-700 leading-relaxed max-w-2xl">
              {problem.description}
            </p>
          </div>

          <div className="space-y-6">
            {problem.requirements?.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 font-mono">
                  Functional Requirements
                </h2>
                <ul className="list-decimal list-inside space-y-1.5 text-sm text-zinc-800 marker:text-zinc-400">
                  {problem.requirements.map((req, i) => (
                    <li key={i} className="leading-relaxed">
                      {req}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {problem.constraints?.length > 0 && (
              <section>
                <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 font-mono">
                  Constraints & Notes
                </h2>
                <ul className="list-disc list-inside space-y-1.5 text-sm text-zinc-800 marker:text-zinc-400">
                  {problem.constraints.map((c, i) => (
                    <li key={i} className="leading-relaxed">
                      {c}
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="pt-4">
            <button
              onClick={() => startTransition(() => startAttempt(problem.id))}
              disabled={isPending}
              className="inline-flex items-center justify-center h-10 px-6 rounded bg-amber-600 hover:bg-amber-700 text-white font-medium text-sm transition-colors disabled:opacity-60"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Starting...
                </>
              ) : (
                'Start Attempt'
              )}
            </button>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="border-t lg:border-t-0 lg:border-l border-zinc-200 pt-8 lg:pt-0 lg:pl-12">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4 font-mono">
            Past Attempts
          </h2>
          
          {isLoadingHistory ? (
            <div className="text-sm text-zinc-500">Loading history...</div>
          ) : completedAttempts.length === 0 ? (
            <div className="text-sm text-zinc-500 italic">
              No completed attempts yet.
            </div>
          ) : (
            <ul className="space-y-4">
              {completedAttempts.map((attempt) => {
                const date = new Date(attempt.createdAt);
                return (
                  <li key={attempt.id} className="text-sm group">
                    <Link
                      href={`/problems/${problem.id}/attempt/${attempt.id}`}
                      className="block"
                    >
                      <div className="flex items-baseline justify-between mb-1">
                        <span className="font-medium text-zinc-900 group-hover:text-amber-600 transition-colors">
                          {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        {attempt.totalScore !== null && (
                          <span className="font-mono text-zinc-600">
                            {attempt.totalScore}/15
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        <span className="w-1 h-1 rounded-full bg-zinc-300" />
                        <span className="text-amber-600 font-medium tracking-wide text-[10px] uppercase">
                          Completed
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </div>
  );
}
