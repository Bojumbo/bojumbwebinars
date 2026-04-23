/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    // Дозволяємо роботу через ваш домен для усунення помилок Cross-origin у режимі dev
    allowedDevOrigins: ['webinars.bojumbohost.pp.ua'],
  }
};

export default nextConfig;
