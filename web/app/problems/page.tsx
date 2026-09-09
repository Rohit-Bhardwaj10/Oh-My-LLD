import Link from 'next/link';

interface Problem {
  id: string;
  title: string;
  description: string;
  constraints: string[];
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
    <div className="flex flex-col min-h-screen bg-zinc-50 font-sans text-zinc-900">
      <header className="px-8 py-6 border-b border-zinc-200 bg-white">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-semibold text-zinc-900 tracking-tight hover:text-amber-600 transition-colors">
            LLD Practice Platform
          </Link>
          <nav className="flex items-center gap-6 text-sm font-medium">
            <span className="text-zinc-900">Problems</span>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-5xl mx-auto py-12 px-8">
        <div className="mb-10">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 mb-2">
            Design Problems
          </h1>
          <p className="text-sm text-zinc-500">
            Select a problem to begin your design attempt.
          </p>
        </div>

        {problems.length === 0 ? (
          <div className="border border-zinc-200 bg-white rounded p-8 text-center text-sm text-zinc-500">
            No problems found. Ensure the server is running.
          </div>
        ) : (
          <div className="border border-zinc-200 bg-white rounded overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-100 border-b border-zinc-200 text-xs text-zinc-500 uppercase tracking-wider font-mono">
                  <th className="px-6 py-3 font-medium">#</th>
                  <th className="px-6 py-3 font-medium">Title</th>
                  <th className="px-6 py-3 font-medium hidden sm:table-cell">Description</th>
                  <th className="px-6 py-3 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="text-sm divide-y divide-zinc-200">
                {problems.map((problem, idx) => (
                  <tr key={problem.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-zinc-500 font-mono">
                      {String(idx + 1).padStart(3, '0')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-zinc-900">
                      <Link href={`/problems/${problem.id}`} className="hover:text-amber-600 transition-colors">
                        {problem.title}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-zinc-500 hidden sm:table-cell">
                      <div className="truncate max-w-md" title={problem.description}>
                        {problem.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <Link
                        href={`/problems/${problem.id}`}
                        className="text-amber-600 hover:text-amber-700 font-medium transition-colors"
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
