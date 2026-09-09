import Link from 'next/link';
import { FileText } from 'lucide-react';
import { Navbar } from '@/components/Navbar';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  constraints?: string[];
}

async function getProblems(): Promise<Problem[]> {
  try {
    const res = await fetch('http://localhost:4000/api/problems', {
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.problems;
  } catch {
    return [];
  }
}

export default async function ProblemsPage() {
  const problems = await getProblems();

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] font-sans text-white selection:bg-white/20">

      <Navbar />

      {/* Main Content */}
      <main className="relative z-10 flex-1 w-full max-w-5xl mx-auto pt-16 pb-12 px-8">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight font-mono uppercase text-white mb-2">
              Design Problems
            </h1>
            <p className="text-white/60">
              Select a canonical system to begin your design attempt.
            </p>
          </div>
        </div>

        {problems.length === 0 ? (
          <div className="border border-white/10 bg-[#0a0a0a] rounded-xl p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/10">
              <FileText className="w-5 h-5 text-white/40" />
            </div>
            <h3 className="text-sm font-medium text-white/90">No problems found</h3>
            <p className="text-sm text-white/50 mt-1">Ensure the backend server is running and populated.</p>
          </div>
        ) : (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5">
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest w-[50%]">Title</th>
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest">Complexity</th>
                  <th className="py-4 px-6 text-xs font-bold text-white/50 uppercase tracking-widest text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {problems.map((problem, idx) => (
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
                    <td className="py-5 px-6 text-right align-middle">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="inline-flex items-center justify-center h-8 px-4 rounded-md bg-[#2a2a2a] hover:bg-[#333] border border-white/5 text-white/90 font-semibold text-xs transition-colors"
                      >
                        Solve
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
