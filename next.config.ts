import type { NextConfig } from "next";

const backendUrl = process.env.BACKEND_URL ?? "http://localhost:3010";

const nextConfig: NextConfig = {
  // GitHub Runner에서 빌드한 서버 산출물만 배포할 수 있도록 standalone 출력을 사용합니다.
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.xodud1202.kro.kr",
      },
    ],
  },
  // /api 요청을 spring-back-end로 프록시합니다.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
