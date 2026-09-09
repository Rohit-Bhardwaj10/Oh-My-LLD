'use client';

import { useState, useTransition, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { startAttempt } from './actions';
import { Navbar } from '@/components/Navbar';

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
  const [activeTab, setActiveTab] = useState<'requirements' | 'constraints'>('requirements');

  useEffect(() => {
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    fetch(`${SERVER_URL}/api/attempts?problemId=${problem.id}`, {
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
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] font-sans text-white selection:bg-white/20 relative">
      <Navbar />
      
      <main className="relative z-10 flex-1 w-full max-w-6xl mx-auto pb-12 px-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12 h-[calc(100vh-100px)]">
        {/* Left Column: Problem Spec */}
        <div className="flex flex-col h-full">
          
          {/* Top: Title & Description */}
          <div className="mb-10 shrink-0">
            <Link
              href="/problems"
              className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm font-medium transition-colors group mb-8"
            >
              <div className="w-8 h-8 rounded-full bg-[#1a1a1a] border border-white/10 flex items-center justify-center group-hover:border-white/20 shadow-sm transition-all">
                <ArrowLeft className="w-4 h-4 text-white/60 group-hover:-translate-x-0.5 transition-transform" />
              </div>
              Back to Dashboard
            </Link>

            <h1 className="text-4xl font-bold tracking-tight font-mono uppercase text-white mb-4 leading-tight">
              {problem.title}
            </h1>
            <p className="text-lg text-white/60 leading-relaxed max-w-2xl">
              {problem.description}
            </p>
          </div>

          {/* Middle: Tabs & Content */}
          <div className="flex-1 min-h-0 flex flex-col mb-8">
            {/* Tabs Navigation */}
            <div className="flex items-center gap-8 border-b border-white/10 mb-8 shrink-0">
              <button 
                onClick={() => setActiveTab('requirements')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'requirements' ? 'border-[#ff6b35] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
              >
                Functional Requirements
              </button>
              <button 
                onClick={() => setActiveTab('constraints')}
                className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'constraints' ? 'border-[#ff6b35] text-white' : 'border-transparent text-white/40 hover:text-white/70'}`}
              >
                Constraints & Notes
              </button>
            </div>

            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto pr-6 custom-scrollbar">
              {activeTab === 'requirements' && (
                <ul className="space-y-6 text-white/80 text-base max-w-3xl">
                  {problem.requirements?.map((req, i) => (
                    <li key={i} className="flex gap-5 leading-relaxed group">
                      <span className="font-mono text-sm text-white/30 mt-0.5 font-bold shrink-0 group-hover:text-[#ff6b35] transition-colors">
                        {(i + 1).toString().padStart(2, '0')}
                      </span>
                      <span>{req}</span>
                    </li>
                  ))}
                </ul>
              )}
              
              {activeTab === 'constraints' && (
                <ul className="space-y-6 text-white/80 text-base max-w-3xl">
                  {problem.constraints?.map((c, i) => (
                    <li key={i} className="flex gap-5 leading-relaxed items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b35] mt-2.5 shrink-0" />
                      <span>{c}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Bottom: Action Button */}
          <div className="shrink-0 pt-6 border-t border-white/10 flex justify-between items-center">
            <p className="text-sm text-white/50">Ready to build? You have up to 15 points to earn.</p>
            <button
              onClick={() => startTransition(() => startAttempt(problem.id))}
              disabled={isPending}
              className="inline-flex items-center justify-center h-12 px-8 rounded-xl bg-[#2a2a2a] hover:bg-[#333] border border-white/5 text-white/90 font-medium text-base transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-70 group"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Initializing Environment...
                </>
              ) : (
                <>
                  Start Design Attempt
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: History */}
        <div className="lg:pt-2">
          <div className="bg-[#0a0a0a] rounded-2xl border border-white/10 shadow-sm p-6 sticky top-8">
            <h2 className="text-sm font-bold text-white uppercase tracking-widest mb-6 border-b border-white/10 pb-4">
              Past Attempts
            </h2>
            
            {isLoadingHistory ? (
              <div className="flex items-center gap-2 text-sm text-white/50">
                <Loader2 className="w-4 h-4 animate-spin" /> Loading history...
              </div>
            ) : completedAttempts.length === 0 ? (
              <div className="text-sm text-white/50 leading-relaxed">
                You haven't completed any attempts for this problem yet. Start one to see your history here.
              </div>
            ) : (
              <ul className="space-y-3">
                {completedAttempts.map((attempt) => {
                  const date = new Date(attempt.createdAt);
                  return (
                    <li key={attempt.id} className="group relative">
                      <Link
                        href={`/problems/${problem.id}/attempt/${attempt.id}`}
                        className="block p-4 rounded-xl border border-white/5 hover:border-white/20 hover:bg-white/[0.02] transition-all cursor-pointer"
                      >
                        <div className="flex items-baseline justify-between mb-2">
                          <span className="font-medium text-white group-hover:text-[#ff6b35] transition-colors">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          {attempt.totalScore !== null && (
                            <span className="font-mono text-sm font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded">
                              {attempt.totalScore}/15
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-white/50 flex items-center gap-2">
                          <span>{date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</span>
                          <span className="w-1 h-1 rounded-full bg-white/30" />
                          <span className="text-[#ff6b35] font-medium tracking-wide uppercase text-[10px]">
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
        </div>
      </main>
    </div>
  );
}
