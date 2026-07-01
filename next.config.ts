import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Uploaded videos go directly to Supabase Storage from the browser,
  // so we don't need a large serverActions body limit here.
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
