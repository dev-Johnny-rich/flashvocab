import type { NextConfig } from "next";

// 静态导出；部署在子路径时（如 GitHub Pages /flashvocab/）由 CI 传入 BASE_PATH
const basePath = process.env.BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  basePath,
  images: { unoptimized: true },
};

export default nextConfig;
