import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
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
    if (!res.ok) throw new Error('Failed to fetch problem');
    const data = await res.json();
    return data.problem;
  } catch {
    return null;
  }
}

// Removed import from middle of file
async function getAttempts(problemId: string) {
  try {
    const headersList = await headers();
    const fetchHeaders = new Headers();
    headersList.forEach((value, key) => {
      fetchHeaders.set(key, value);
    });

    const res = await fetch(`http://localhost:4000/api/attempts?problemId=${problemId}`, {
      headers: fetchHeaders,
      cache: 'no-store',
    });
    
    if (!res.ok) return [];
    const data = await res.json();
    return data.attempts || [];
  } catch {
    return [];
  }
}

export default async function ProblemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const [problem, attempts] = await Promise.all([
    getProblem(id),
    getAttempts(id),
  ]);

  if (!problem) notFound();

  return <ProblemDetailClient problem={problem} initialAttempts={attempts} />;
}
