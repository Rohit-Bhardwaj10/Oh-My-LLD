'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function startAttempt(problemId: string) {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const SERVER_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:4000';
  const res = await fetch(`${SERVER_URL}/api/attempts`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
    body: JSON.stringify({ problemId }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start attempt');
  }

  const data = await res.json();
  const attemptId = data.attempt.id;

  redirect(`/problems/${problemId}/attempt/${attemptId}`);
}
