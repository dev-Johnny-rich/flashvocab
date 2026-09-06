import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export", // 静态导出（Cloudflare Pages / 任意静态托管）
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
