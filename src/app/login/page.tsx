"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

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
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-xl2 border border-line bg-surface p-8">
        <h1 className="font-serif text-2xl font-medium tracking-tight text-ink">Command Center</h1>
        <p className="mt-2 text-sm text-ink2">Sign in with your email to continue.</p>

        {sent ? (
          <p className="mt-6 text-sm text-ink2">
            Check <span className="font-medium text-ink">{email}</span> for a sign-in link.
          </p>
        ) : (
          <form onSubmit={sendLink} className="mt-6 flex flex-col gap-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11 rounded-lg border border-line2 bg-surface px-3 text-ink outline-none focus:border-accent focus:ring-2 focus:ring-accentbg"
            />
            <button
              type="submit"
              disabled={loading}
              className="h-11 rounded-lg bg-accent font-medium text-onaccent disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send sign-in link"}
            </button>
            {error && <p className="text-sm text-red">{error}</p>}
          </form>
        )}
      </div>
    </div>
  );
}
