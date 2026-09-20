import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";
const basePath = isGitHubPages ? process.env.NEXT_PUBLIC_BASE_PATH ?? "" : "";

const nextConfig: NextConfig = isGitHubPages
  ? {
      agentRules: false,
      output: "export",
      basePath,
      assetPrefix: basePath,
      trailingSlash: true,
      images: { unoptimized: true },
    }
  : { agentRules: false };

export default nextConfig;
