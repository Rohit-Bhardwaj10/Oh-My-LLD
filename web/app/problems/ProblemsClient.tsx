'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FileText, Search } from 'lucide-react';
import { authClient } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  constraints?: string[];
}

const DIFFICULTY_TAGS = ['All', 'Low', 'Medium', 'High'];

function getDifficulty(problem: Problem): string {
  const total = (problem.requirements?.length || 0) + (problem.constraints?.length || 0);
  if (total <= 2) return 'Low';
  if (total <= 4) return 'Medium';
  return 'High';
}

const DIFFICULTY_COLORS: Record<string, string> = {
  Low: 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10',
  Medium: 'text-amber-400 border-amber-400/30 bg-amber-400/10',
  High: 'text-red-400 border-red-400/30 bg-red-400/10',
};

export default function ProblemsClient({ problems }: { problems: Problem[] }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push('/login');
  };

  const filtered = useMemo(() => {
    return problems.filter((p) => {
      const matchesSearch =
        p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase());
      const matchesFilter = filter === 'All' || getDifficulty(p) === filter;
      return matchesSearch && matchesFilter;
    });
  }, [problems, search, filter]);

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] font-sans text-white selection:bg-white/20">

      {/* Hero Section — navbar baked in */}
      <div className="relative w-full h-80 md:h-[420px] overflow-hidden">
        <Image
          src="/AI_Bg_031(1).png"
          alt="Design Problems Hero"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Gradient overlay: dark at top (for nav legibility) + fade to page bg at bottom */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-[#0a0a0a]" />

        {/* ── Navbar row ── */}
        <div className="absolute top-0 left-0 right-0 z-20 px-8 md:px-12 py-6 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="w-5 h-5 flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#ff6b35]">
                <path d="M12 2L22 19H2L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="12" cy="13" r="2.5" fill="currentColor" />
              </svg>
            </div>
            <span className="font-bold tracking-widest text-[15px] text-white mt-0.5">PREP</span>
          </Link>

          {/* Nav pill */}
          <nav className="hidden md:flex items-center bg-black/40 backdrop-blur-md border border-white/10 p-1 text-[13px] font-medium text-white/70">
            <Link href="/problems" className="px-5 py-2 text-white bg-white/10 transition-colors">
              Platform
            </Link>
            {!isPending && !session && (
              <>
                <Link href="/login" className="px-5 py-2 hover:text-white transition-colors">Log in</Link>
                <Link href="/signup" className="px-5 py-2 hover:text-white transition-colors">Sign up</Link>
              </>
            )}
            {!isPending && session && (
              <button onClick={handleSignOut} className="px-5 py-2 hover:text-white transition-colors">
                Sign out
              </button>
            )}
          </nav>
        </div>

        {/* ── Hero Text ── */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
          <p className="text-[#ff6b35] font-mono text-xs uppercase tracking-[0.3em] mb-3 font-bold">
            Practice Platform
          </p>
          <h1 className="text-4xl md:text-6xl font-bold font-mono uppercase tracking-tight text-white drop-shadow-lg">
            Design Problems
          </h1>
          <p className="mt-4 text-white/60 text-sm md:text-base max-w-md">
            Select a canonical system to begin your design attempt.
          </p>
        </div>
      </div>

      {/* Search + Filter Bar */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex flex-col sm:flex-row gap-3 items-center">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search problems..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-all"
            />
          </div>

          {/* Difficulty Filter */}
          <div className="flex gap-2">
            {DIFFICULTY_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilter(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all ${
                  filter === tag
                    ? 'bg-[#ff6b35] border-[#ff6b35] text-white'
                    : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Problem List */}
      <main className="flex-1 w-full max-w-5xl mx-auto pt-8 pb-12 px-6">
        <p className="text-xs text-white/40 font-mono mb-4 uppercase tracking-widest">
          {filtered.length} problem{filtered.length !== 1 ? 's' : ''} found
        </p>

        {filtered.length === 0 ? (
          <div className="border border-white/10 bg-[#0a0a0a] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <FileText className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="text-sm font-medium text-white/90">No problems found</h3>
            <p className="text-sm text-white/50 mt-1">Try a different search or filter.</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest w-[50%]">Title</th>
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest">Complexity</th>
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest">Difficulty</th>
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtered.map((problem, idx) => {
                  const diff = getDifficulty(problem);
                  return (
                    <tr
                      key={problem.id}
                      className={`group hover:bg-[#1a1a1a] transition-colors ${idx % 2 !== 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}
                    >
                      <td className="py-5 px-6">
                        <Link href={`/problems/${problem.id}`} className="block">
                          <div className="font-semibold text-base text-white/90 group-hover:text-[#ff6b35] transition-colors">
                            {problem.title}
                          </div>
                          <div className="text-sm text-white/50 mt-1 line-clamp-1 max-w-lg">
                            {problem.description}
                          </div>
                        </Link>
                      </td>
                      <td className="py-5 px-6 align-middle">
                        <div className="flex gap-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
                            {problem.requirements?.length || 0} reqs
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-white/5 text-white/60 border border-white/10">
                            {problem.constraints?.length || 0} constraints
                          </span>
                        </div>
                      </td>
                      <td className="py-5 px-6 align-middle">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider border ${DIFFICULTY_COLORS[diff]}`}>
                          {diff}
                        </span>
                      </td>
                      <td className="py-5 px-6 text-right align-middle">
                        <Link
                          href={`/problems/${problem.id}`}
                          className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-[#2a2a2a] hover:bg-[#ff6b35] border border-white/5 hover:border-[#ff6b35] text-white/90 font-semibold text-xs transition-all"
                        >
                          Solve
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
