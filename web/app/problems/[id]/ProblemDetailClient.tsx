'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen, History, Loader2 } from 'lucide-react';
import { TabBar } from './TabBar';
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
}

export function ProblemDetailClient({ problem }: ProblemDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'history'>('problem');
  const [isPending, startTransition] = useTransition();

  return (
    <main className="min-h-screen px-6 py-12 max-w-4xl mx-auto">
      {/* Back nav */}
      <Link
        href="/problems"
        className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm mb-10 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        All Problems
      </Link>

      {/* Problem header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold tracking-tight text-white mb-3">
          {problem.title}
        </h1>
        <p className="text-slate-400 text-base leading-relaxed max-w-2xl">
          {problem.description}
        </p>
      </div>

      {/* Tabs */}
      <TabBar active={activeTab} onChange={setActiveTab} />

      {/* Problem Tab */}
      {activeTab === 'problem' && (
        <div className="space-y-8">
          {/* Requirements */}
          {problem.requirements?.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-4 h-4 text-violet-400" />
                <h2 className="text-sm font-semibold text-violet-300 uppercase tracking-wider">
                  Requirements
                </h2>
              </div>
              <div className="glass rounded-2xl p-6 space-y-3">
                {problem.requirements.map((req, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1 w-5 h-5 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-400 text-xs font-bold shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-slate-300 text-sm leading-relaxed">{req}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Constraints */}
          {problem.constraints?.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-4 h-4 text-blue-400" />
                <h2 className="text-sm font-semibold text-blue-300 uppercase tracking-wider">
                  Constraints & Notes
                </h2>
              </div>
              <div className="glass rounded-2xl p-6 space-y-3">
                {problem.constraints.map((c, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                    <p className="text-slate-400 text-sm leading-relaxed">{c}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Start CTA */}
          <div className="pt-4">
            <button
              onClick={() => startTransition(() => startAttempt(problem.id))}
              disabled={isPending}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Starting…
                </>
              ) : (
                'Start Attempt →'
              )}
            </button>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="glass rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
          <div className="p-4 rounded-2xl bg-slate-800/50">
            <History className="w-8 h-8 text-slate-500" />
          </div>
          <p className="text-slate-400 font-medium">No attempts yet</p>
          <p className="text-slate-500 text-sm max-w-xs">
            Your submission history for this problem will appear here once you start an attempt.
          </p>
        </div>
      )}
    </main>
  );
}
