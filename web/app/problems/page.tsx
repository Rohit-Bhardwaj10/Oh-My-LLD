"use client";

import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export default function ProblemsPage() {
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/login");
  };

  return (
    <div className="min-h-screen p-8 bg-background text-foreground">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-primary">Problems</h1>
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
          >
            Sign Out
          </button>
        </div>
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
          <p className="text-muted-foreground">
            Welcome to the problems page! Here you will see the list of problems to solve.
          </p>
        </div>
      </div>
    </div>
  );
}
