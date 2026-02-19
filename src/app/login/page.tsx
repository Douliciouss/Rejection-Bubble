"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setShowResend(false);
    setLoading(true);
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        const isUnconfirmed = err.message.toLowerCase().includes("email not confirmed");
        setError(isUnconfirmed ? "Please confirm your email before signing in. Check your inbox (and spam folder) for the confirmation link." : err.message);
        if (isUnconfirmed) setShowResend(true);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (message === "Failed to fetch" || message.includes("fetch")) {
        setError(
          "Could not reach the auth server. Check that .env.local has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, restart the dev server, and that your Supabase project is not paused."
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResendLoading(true);
    setError(null);
    const { error: err } = await supabase.auth.resend({ type: "signup", email });
    setResendLoading(false);
    if (err) {
      setError(err.message);
      return;
    }
    setResendSent(true);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-bubble-surface border border-bubble-border focus:border-bubble-accent outline-none transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-lg bg-bubble-surface border border-bubble-border focus:border-bubble-accent outline-none transition-colors"
          />
          {error && (
            <div className="space-y-2">
              <p className="text-sm text-bubble-danger">{error}</p>
              {showResend && (
                <div className="flex flex-col gap-2">
                  {resendSent ? (
                    <p className="text-sm text-bubble-success">Confirmation email sent. Check your inbox.</p>
                  ) : (
                    <button
                      type="button"
                      onClick={handleResend}
                      disabled={resendLoading}
                      className="text-sm text-bubble-accent hover:underline disabled:opacity-50"
                    >
                      {resendLoading ? "Sending…" : "Resend confirmation email"}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="text-center text-sm text-bubble-muted">
          No account?{" "}
          <Link href="/signup" className="text-bubble-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
