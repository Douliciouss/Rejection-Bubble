"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pendingConfirmation, setPendingConfirmation] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPendingConfirmation(false);
    setLoading(true);
    try {
      const { data, error: err } = await supabase.auth.signUp({ email, password });
      if (err) {
        setError(err.message);
        return;
      }
      // If Supabase requires email confirmation, session may be null until they confirm
      if (data.session) {
        router.push("/dashboard");
        router.refresh();
      } else {
        setPendingConfirmation(true);
      }
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

  if (pendingConfirmation) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-6 text-center">
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-bubble-muted">
            We sent a confirmation link to <strong className="text-zinc-200">{email}</strong>. Click it to activate your account, then sign in.
          </p>
          <p className="text-sm text-bubble-muted">
            Check spam if you don’t see it.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90"
          >
            Go to sign in
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center">Create account</h1>
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
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 rounded-lg bg-bubble-surface border border-bubble-border focus:border-bubble-accent outline-none transition-colors"
          />
          {error && (
            <p className="text-sm text-bubble-danger">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {loading ? "Creating account…" : "Sign up"}
          </button>
        </form>
        <p className="text-center text-sm text-bubble-muted">
          Already have an account?{" "}
          <Link href="/login" className="text-bubble-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
