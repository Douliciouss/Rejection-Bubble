"use client";

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function DashboardNav({ userEmail }: { userEmail?: string }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="shrink-0 h-14 flex items-center justify-between px-6 border-b border-bubble-border bg-bubble-surface">
      <Link href="/dashboard" className="font-semibold text-bubble-accent">
        Reject Bubbles
      </Link>
      <div className="flex items-center gap-4">
        {userEmail && (
          <span className="text-sm text-bubble-muted hidden sm:inline">{userEmail}</span>
        )}
        <button
          type="button"
          onClick={signOut}
          className="text-sm text-bubble-muted hover:text-zinc-100 transition-colors"
        >
          Sign out
        </button>
      </div>
    </header>
  );
}
