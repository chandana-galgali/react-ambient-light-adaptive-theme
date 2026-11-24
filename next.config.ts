import type { NextConfig } from "next";

// The demo site is a static export so it can be hosted on GitHub Pages.
// The Pages workflow sets NEXT_PUBLIC_BASE_PATH to "/<repo-name>".
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
