'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Clock, BookOpen, History, Loader2, CheckCircle2, FileEdit } from 'lucide-react';
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
  initialAttempts: any[];
}

export function ProblemDetailClient({ problem, initialAttempts }: ProblemDetailClientProps) {
  const [activeTab, setActiveTab] = useState<'problem' | 'history'>('problem');
  const [isPending, startTransition] = useTransition();
  const [attempts, setAttempts] = useState<any[]>(initialAttempts);

  useEffect(() => {
    if (activeTab === 'history') {
      fetch(`http://localhost:4000/api/attempts?problemId=${problem.id}`, {
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.attempts) {
            setAttempts(data.attempts);
          }
        })
        .catch(console.error);
    }
  }, [activeTab, problem.id]);

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
        <div className="space-y-4">
          {attempts.filter(a => a.status === 'COMPLETED').length === 0 ? (
            <div className="glass border border-slate-800/50 rounded-2xl p-12 flex flex-col items-center justify-center text-center gap-4">
              <div className="p-4 rounded-2xl bg-slate-800/30">
                <History className="w-8 h-8 text-slate-500" />
              </div>
              <p className="text-slate-300 font-medium text-lg">No completed attempts yet</p>
              <p className="text-slate-500 text-sm max-w-sm leading-relaxed">
                Your completed submission history for this problem will appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {attempts.filter(a => a.status === 'COMPLETED').map((attempt) => {
                const date = new Date(attempt.createdAt);
                const isCompleted = attempt.status === 'COMPLETED';
                const isDraft = attempt.status === 'DRAFT';

                return (
                  <Link
                    key={attempt.id}
                    href={`/problems/${problem.id}/attempt/${attempt.id}`}
                    className="glass border border-slate-800/60 p-5 sm:p-6 rounded-2xl hover:border-slate-700 hover:bg-slate-800/40 transition-all duration-300 group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start sm:items-center gap-4 sm:gap-5">
                      <div className={`p-3 rounded-xl shrink-0 ${
                        isCompleted ? 'bg-emerald-500/10 text-emerald-400' :
                        isDraft ? 'bg-slate-500/10 text-slate-400' :
                        'bg-blue-500/10 text-blue-400'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> :
                         isDraft ? <FileEdit className="w-5 h-5" /> :
                         <Loader2 className="w-5 h-5 animate-spin" />}
                      </div>
                      
                      <div>
                        <div className="flex items-center gap-3 mb-1.5">
                          <span className="text-slate-200 font-semibold text-base group-hover:text-white transition-colors">
                            {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                            isCompleted ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/20' :
                            isDraft ? 'bg-slate-500/20 text-slate-400 border border-slate-500/20' :
                            'bg-blue-500/20 text-blue-400 border border-blue-500/20'
                          }`}>
                            {attempt.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    </div>
                    
                    {attempt.totalScore !== null && (
                      <div className="flex flex-col sm:items-end justify-center pl-[52px] sm:pl-0">
                        <span className="text-[10px] text-slate-500 uppercase font-bold tracking-widest mb-1 flex items-center gap-1.5">
                          Total Score
                        </span>
                        <div className="flex items-baseline gap-0.5">
                          <span className="text-2xl font-bold text-violet-400 tracking-tight">{attempt.totalScore}</span>
                          <span className="text-slate-600 font-semibold text-sm">/15</span>
                        </div>
                      </div>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
