/** @type {import('next').NextConfig} */
const nextConfig = {
  // Transpile Supabase sub-packages (NOT the main package — see serverComponentsExternalPackages)
  transpilePackages: [
    "@supabase/realtime-js",
    "@supabase/postgrest-js",
    "@supabase/storage-js",
    "@supabase/functions-js",
  ],
  experimental: {
    // Keep the main supabase-js out of the server bundle — it uses browser-only APIs
    serverComponentsExternalPackages: ["@supabase/supabase-js"],
  },
};

export default nextConfig;
