import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          {
            key: "Content-Type",
            value: "application/javascript; charset=utf-8",
          },
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
        ],
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins: [
        "custody-alliance-ensemble-donor.trycloudflare.com"
      ]
    }
  }
};

export default nextConfig;
