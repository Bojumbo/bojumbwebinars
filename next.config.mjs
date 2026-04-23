/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  // eslint було видалено, бо Next 15+ ігнорує його в цьому конфігу
};

export default nextConfig;
