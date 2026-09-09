import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Editor } from './Editor';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements: string[];
  constraints: string[];
}

async function getProblem(problemId: string): Promise<Problem | null> {
  try {
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const res = await fetch(`${SERVER_URL}/api/problems/${problemId}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.problem ?? null;
  } catch {
    return null;
  }
}

async function getAttempt(attemptId: string) {
  try {
    const cookieStore = await cookies();
    const cookieHeader = cookieStore.getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const res = await fetch(`${SERVER_URL}/api/attempts/${attemptId}`, {
      headers: { Cookie: cookieHeader },
      cache: 'no-store',
    });
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function AttemptEditorPage({
  params,
}: {
  params: Promise<{ id: string; attemptId: string }>;
}) {
  const { id: problemId, attemptId } = await params;

  const [data, problem] = await Promise.all([
    getAttempt(attemptId),
    getProblem(problemId),
  ]);

  if (!data || !problem) notFound();

  return (
    <Editor
      attemptId={attemptId}
      problemId={problemId}
      problem={problem}
    />
  );
}
