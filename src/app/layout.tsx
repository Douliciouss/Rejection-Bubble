import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Reject Bubbles — Rejection Journal & Insight",
  description: "Log rejections, see patterns, improve.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-bubble-bg text-zinc-100">
        {children}
      </body>
    </html>
  );
}
