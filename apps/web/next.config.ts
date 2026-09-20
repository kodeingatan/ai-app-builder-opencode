import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/builder", destination: "/templates-persuratan", permanent: false },
      { source: "/builder/:path*", destination: "/templates-persuratan", permanent: false },
      { source: "/preview", destination: "/templates-persuratan", permanent: false },
      { source: "/preview/:path*", destination: "/templates-persuratan", permanent: false },
      { source: "/templates", destination: "/templates-persuratan", permanent: false },
      { source: "/templates/:path*", destination: "/templates-persuratan", permanent: false },
      { source: "/documents", destination: "/hasil-persuratan", permanent: false },
      { source: "/documents/:path*", destination: "/hasil-persuratan", permanent: false },
      { source: "/components", destination: "/components-persuratan", permanent: false },
      { source: "/components/:path*", destination: "/components-persuratan", permanent: false },
      { source: "/data-sources", destination: "/global-tables", permanent: false },
      { source: "/data-sources/:path*", destination: "/global-tables", permanent: false },
      { source: "/employees", destination: "/global-tables", permanent: false },
      { source: "/employees/:path*", destination: "/global-tables", permanent: false },
    ];
  },
  async rewrites() {
    return [];
  },
};

export default nextConfig;
