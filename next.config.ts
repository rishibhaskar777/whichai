import type { NextConfig } from "next";
import { getEnv } from "./src/lib/env";

getEnv();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  devIndicators: false,
};

export default nextConfig;
