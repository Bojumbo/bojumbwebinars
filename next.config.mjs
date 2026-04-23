/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // Переміщено в корінь, як того вимагає Next.js 15+
  allowedDevOrigins: ['webinars.bojumbohost.pp.ua'],
};

export default nextConfig;
