import ProblemsClient from './ProblemsClient';

interface Problem {
  id: string;
  title: string;
  description: string;
  requirements?: string[];
  constraints?: string[];
}

async function getProblems(): Promise<Problem[]> {
  try {
    const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
    const res = await fetch(`${SERVER_URL}/api/problems`, {
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
  return <ProblemsClient problems={problems} />;
}
