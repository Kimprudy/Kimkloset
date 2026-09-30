/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Lets product photos be hosted in Supabase Storage (no redeploy needed to add items)
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
  },
};

export default nextConfig;
