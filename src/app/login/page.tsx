"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

// The login screen always wears the dark brand look (like the reference),
// regardless of the app's own light/dark toggle elsewhere — so colors here
// are the .dark palette's literal values, not the bg/surface/ink tokens
// that flip with the toggle.
export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    setLoading(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="flex min-h-screen flex-col justify-between bg-[#091d1c] px-6 py-10 sm:px-16">
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-[#d5a965]" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinecap="round">
          <path d="M12 2v6M12 16v6M2 12h6M16 12h6M5.3 5.3l4.2 4.2M14.5 14.5l4.2 4.2M18.7 5.3l-4.2 4.2M9.5 14.5l-4.2 4.2" />
        </svg>
        <span className="font-serif text-lg font-semibold text-[#eee6e0]">Command Center</span>
      </div>

      <div className="mx-auto w-full max-w-md">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#d5a965]">
          Your space to think clearly
        </span>
        <h1 className="mt-4 font-serif text-[44px] font-medium leading-[1.1] tracking-tight text-[#eee6e0] sm:text-[52px]">
          Make room for
          <br />
          <span className="italic text-[#d5a965]">what matters.</span>
        </h1>
        <p className="mt-4 text-[15px] text-[#a7998c]">A quieter place to keep work moving, together.</p>

        {sent ? (
          <p className="mt-8 text-[15px] text-[#a7998c]">
            Check <span className="font-medium text-[#eee6e0]">{email}</span> for a secure sign-in link.
          </p>
        ) : (
          <form onSubmit={sendLink} className="mt-8 flex flex-col gap-3">
            <label className="text-sm font-medium text-[#eee6e0]">Email address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              className="h-[52px] rounded-[10px] border border-[#1c3a39] bg-[#0c2423] px-4 text-[#eee6e0] placeholder-[#5f6e68] outline-none focus:border-[#d5a965]"
            />
            <button
              type="submit"
              disabled={loading}
              className="flex h-[52px] items-center justify-center gap-2 rounded-[10px] bg-[#d5a965] font-medium text-[#1c150a] transition hover:brightness-105 disabled:opacity-60"
            >
              {loading ? "Sending..." : "Continue with email"}
              {!loading && (
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              )}
            </button>
            <p className="text-xs text-[#637268]">No password needed. We&apos;ll email you a secure link.</p>
            {error && <p className="text-sm text-[#daa69e]">{error}</p>}
          </form>
        )}
      </div>

      <div className="flex items-center justify-between text-xs text-[#637268]">
        <span>A little more clarity, every day.</span>
        <span>© {new Date().getFullYear()} Command Center</span>
      </div>
    </div>
  );
}
