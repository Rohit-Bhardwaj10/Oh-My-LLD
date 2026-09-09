import Link from 'next/link';
import { ArrowRight, Code2, Cpu, ShoppingCart } from 'lucide-react';

interface Problem {
  id: string;
  title: string;
  description: string;
  constraints: string[];
}

const PROBLEM_ICONS: Record<string, React.ReactNode> = {
  'Parking Lot': <ShoppingCart className="w-6 h-6" />,
  'Elevator System': <Cpu className="w-6 h-6" />,
  'Vending Machine': <Code2 className="w-6 h-6" />,
};

const PROBLEM_GRADIENTS: Record<string, string> = {
  'Parking Lot': 'from-violet-500/20 to-purple-600/10',
  'Elevator System': 'from-blue-500/20 to-cyan-600/10',
  'Vending Machine': 'from-emerald-500/20 to-teal-600/10',
};

const PROBLEM_ACCENT: Record<string, string> = {
  'Parking Lot': 'text-violet-400',
  'Elevator System': 'text-blue-400',
  'Vending Machine': 'text-emerald-400',
};

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
    <main className="min-h-screen px-6 py-16 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-14">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass mb-6 text-xs font-medium text-violet-300 tracking-wide uppercase">
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          Low-Level Design
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4 bg-gradient-to-br from-white to-slate-400 bg-clip-text text-transparent">
          Design Challenges
        </h1>
        <p className="text-slate-400 text-lg max-w-xl">
          Pick a problem, architect a solution across three stages, and get AI-powered feedback on your design.
        </p>
      </div>

      {/* Problem Cards */}
      {problems.length === 0 ? (
        <div className="glass rounded-2xl p-10 text-center text-slate-400">
          <p>No problems found. Make sure the server is running.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-3">
          {problems.map((problem, idx) => {
            const icon = PROBLEM_ICONS[problem.title] ?? <Code2 className="w-6 h-6" />;
            const gradient = PROBLEM_GRADIENTS[problem.title] ?? 'from-slate-500/20 to-slate-600/10';
            const accent = PROBLEM_ACCENT[problem.title] ?? 'text-slate-400';

            return (
              <Link
                key={problem.id}
                href={`/problems/${problem.id}`}
                className="group glass glass-hover rounded-2xl p-6 flex flex-col gap-5 no-underline"
              >
                {/* Icon + Badge */}
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} ${accent}`}>
                    {icon}
                  </div>
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full glass text-slate-400">
                    #{idx + 1}
                  </span>
                </div>

                {/* Title & Description */}
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-violet-300 transition-colors">
                    {problem.title}
                  </h2>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">
                    {problem.description}
                  </p>
                </div>

                {/* Footer CTA */}
                <div className={`flex items-center gap-1.5 text-sm font-medium ${accent} group-hover:gap-2.5 transition-all`}>
                  Start Challenge
                  <ArrowRight className="w-4 h-4" />
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
