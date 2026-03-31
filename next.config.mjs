/** @type {import('next').NextConfig} */
const nextConfig = {
  // cheerio, axios 등 Node.js 패키지를 서버 컴포넌트에서 번들링하지 않고 외부 처리
  experimental: {
    serverComponentsExternalPackages: ["cheerio", "axios"],
  },
};

export default nextConfig;
