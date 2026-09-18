import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // base url / langsung ke dashboard surat - mempermudah akses user
      // page.tsx sudah redirect, ini backup untuk edge / prefetch
      // (keep /generated/surat-platform tetap jalan sebagai canonical)
    ];
  },
  async rewrites() {
    return [
      // short alias di root -> canonical. User cukup buka / di browser
      // wildcard :path* agar detail /templates/123 juga ikut ter-alias
      { source: "/builder", destination: "/generated/surat-platform/builder" },
      { source: "/builder/:path*", destination: "/generated/surat-platform/builder/:path*" },
      { source: "/preview", destination: "/generated/surat-platform/preview" },
      { source: "/preview/:path*", destination: "/generated/surat-platform/preview/:path*" },
      { source: "/templates", destination: "/generated/surat-platform/templates" },
      { source: "/templates/:path*", destination: "/generated/surat-platform/templates/:path*" },
      { source: "/documents", destination: "/generated/surat-platform/documents" },
      { source: "/documents/:path*", destination: "/generated/surat-platform/documents/:path*" },
      { source: "/employees", destination: "/generated/surat-platform/employees" },
      { source: "/employees/:path*", destination: "/generated/surat-platform/employees/:path*" },
      { source: "/components", destination: "/generated/surat-platform/components" },
      { source: "/components/:path*", destination: "/generated/surat-platform/components/:path*" },
      { source: "/data-sources", destination: "/generated/surat-platform/data-sources" },
      { source: "/data-sources/:path*", destination: "/generated/surat-platform/data-sources/:path*" },
    ];
  },
};

export default nextConfig;
