import { notFound } from 'next/navigation';
import { ProblemDetailClient } from './ProblemDetailClient';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  constraints: string[];
}

async function getProblem(id: string): Promise<Problem | null> {
  try {
    const res = await fetch(`http://localhost:4000/api/problems/${id}`, {
      cache: 'no-store',
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch');
    const data = await res.json();
    return data.problem;
  } catch {
    return null;
  }
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const problem = await getProblem(id);

  if (!problem) notFound();

  return <ProblemDetailClient problem={problem} />;
}
