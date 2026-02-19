import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly expose server-only env so they're available in Server Actions (helps with Turbopack)
  env: {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,
  },
};

export default nextConfig;

