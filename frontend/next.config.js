/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera um build "standalone" (autossuficiente) ideal para Docker/Coolify.
  output: "standalone",
};

module.exports = nextConfig;
