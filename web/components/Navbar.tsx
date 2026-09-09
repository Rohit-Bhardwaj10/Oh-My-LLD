"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

export function Navbar() {
  const { data: session, isPending } = authClient.useSession();
  const router = useRouter();

  const handleSignOut = async () => {
    await authClient.signOut();
    router.refresh();
  };

  return (
    <header className="relative z-50 w-full px-8 md:px-12 py-8 flex items-center justify-between pointer-events-auto">
      <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
        {/* Logo icon imitating the orange triangle */}
        <div className="w-5 h-5 flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-[#ff6b35]">
            <path d="M12 2L22 19H2L12 2Z" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="12" cy="13" r="2.5" fill="currentColor" />
          </svg>
        </div>
        <span className="font-bold tracking-widest text-[15px] text-white mt-0.5">PREP</span>
      </Link>
      
      {/* Navigation pill */}
      <nav className="hidden md:flex items-center bg-[#1a1a1a]/80 backdrop-blur-md border border-white/5 p-1 text-[13px] font-medium text-white/70">
        <Link href="/problems" className="px-5 py-2 text-white bg-white/10 transition-colors">
          Platform
        </Link>
        {!isPending && !session && (
          <>
            <Link href="/login" className="px-5 py-2 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/signup" className="px-5 py-2 hover:text-white transition-colors">
              Sign up
            </Link>
          </>
        )}
        {!isPending && session && (
          <button onClick={handleSignOut} className="px-5 py-2 hover:text-white transition-colors">
            Sign out
          </button>
        )}
      </nav>
    </header>
  );
}
