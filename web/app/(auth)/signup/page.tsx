"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Code2, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);
    const { data, error } = await authClient.signUp.email({
      email,
      password,
      name,
    });
    if (error) {
      setError(error.message || "Failed to sign up");
      setIsLoading(false);
    } else {
      window.location.href = "/problems";
    }
  };

  return (
    <div className="min-h-screen flex bg-[#0a0a0a] font-sans text-white selection:bg-white/20">
      {/* Left side - Visual/Brand */}
      <div className="hidden lg:flex w-1/2 bg-[#0a0a0a] p-12 flex-col relative overflow-hidden border-r border-white/10">
        <div className="absolute inset-0 opacity-10" 
             style={{ backgroundImage: 'radial-gradient(#ffffff 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        
        {/* Subtle glow */}
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-[#ff6b35]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex-none">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity w-fit">
            <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
              <Code2 className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold tracking-tight text-lg">PREP</span>
          </Link>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <div className="max-w-md">
            <h2 className="text-4xl font-bold font-mono uppercase tracking-tight mb-6 leading-[1.1] text-white">
              Start your journey.
            </h2>
            <p className="text-white/50 text-lg leading-relaxed mb-8">
              Create an account to track your progress, save your design attempts, and receive personalized AI evaluations.
            </p>
            
            <div className="flex flex-col gap-4 border-t border-white/10 pt-8 mt-8">
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                <span className="text-sm">Canonical system design problems</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                <span className="text-sm">Distraction-free markdown editor</span>
              </div>
              <div className="flex items-center gap-3 text-white/70">
                <div className="w-1.5 h-1.5 rounded-full bg-[#ff6b35]" />
                <span className="text-sm">Instant, criterion-based AI feedback</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 relative z-10 bg-[#0a0a0a]">
        <div className="w-full max-w-sm space-y-8">
          
          {/* Mobile Header */}
          <div className="lg:hidden flex justify-center mb-12">
            <Link href="/" className="flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded bg-white/5 flex items-center justify-center border border-white/10">
                <Code2 className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold tracking-tight text-lg">PREP</span>
            </Link>
          </div>

          <div className="text-center lg:text-left">
            <h1 className="text-3xl font-bold tracking-tight mb-2 font-mono uppercase text-white">Create an account</h1>
            <p className="text-white/50 text-sm">Enter your details to get started.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-5">
            {error && (
              <div className="p-3 text-sm text-red-400 bg-red-950/50 border border-red-900/50 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-all shadow-sm placeholder:text-white/30 text-white"
                placeholder="Jane Doe"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">Email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-all shadow-sm placeholder:text-white/30 text-white"
                placeholder="you@example.com"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-white/70">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 bg-[#1a1a1a] rounded-lg border border-white/10 focus:outline-none focus:ring-2 focus:ring-[#ff6b35] focus:border-transparent transition-all shadow-sm text-white placeholder:text-white/30"
                placeholder="••••••••"
                required
                minLength={8}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 bg-[#ff6b35] text-white font-medium rounded-lg hover:bg-[#e05a2a] transition-all shadow-sm flex items-center justify-center gap-2 group disabled:opacity-70 mt-4"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Create Account
              {!isLoading && <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />}
            </button>
          </form>

          <p className="text-center text-sm text-white/50">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-white hover:text-[#ff6b35] transition-colors">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
