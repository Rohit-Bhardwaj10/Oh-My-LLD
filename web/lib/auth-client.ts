import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
    baseURL: typeof window !== "undefined"
      ? window.location.origin   // browser: use same origin → Next.js proxies to backend
      : (process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:4000") // SSR: hit backend directly
})
