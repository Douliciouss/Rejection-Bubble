import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-8 p-8">
      <h1 className="text-4xl font-bold text-bubble-accent">Reject Bubbles</h1>
      <p className="text-bubble-muted text-center max-w-md">
        Log rejections, see patterns, improve. Your private rejection journal with bubble visualization.
      </p>
      <div className="flex gap-4">
        <Link
          href="/login"
          className="px-6 py-3 rounded-lg bg-bubble-surface border border-bubble-border hover:border-bubble-accent transition-colors"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="px-6 py-3 rounded-lg bg-bubble-accent text-bubble-bg font-medium hover:opacity-90 transition-opacity"
        >
          Get started
        </Link>
      </div>
    </main>
  );
}
