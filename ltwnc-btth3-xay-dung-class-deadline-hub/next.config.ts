import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger build (RAM/CPU thấp): chạy đơn luồng để tránh lỗi tràn bộ nhớ/spawn worker.
  experimental: {
    cpus: 1,
    workerThreads: false,
    webpackBuildWorker: false,
  },
};

export default nextConfig;
