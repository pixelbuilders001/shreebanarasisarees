import type { NextConfig } from "next";

const allowedOriginsEnv = process.env.ALLOWED_ORIGINS;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(",").map((s) => s.trim())
  : ["localhost:3000", "shreebanarasisarees.in", "www.shreebanarasisarees.in", "shreebanarasisarees.com", "www.shreebanarasisarees.com"];

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://*.googletagmanager.com https://*.clarity.ms https://www.gstatic.com https://*.cashfree.com;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' data: blob: https://ik.imagekit.io https://*.supabase.co https://images.unsplash.com https://www.googletagmanager.com https://*.google-analytics.com https://*.clarity.ms https://c.bing.com;
  font-src 'self' data: https://fonts.gstatic.com;
  connect-src 'self' https://vzqlsawxvvyvsstyzzff.supabase.co https://*.supabase.co wss://vzqlsawxvvyvsstyzzff.supabase.co wss://*.supabase.co https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://stats.g.doubleclick.net https://*.clarity.ms https://c.bing.com https://fcm.googleapis.com https://fcmregistrations.googleapis.com https://firebaseinstallations.googleapis.com https://*.firebaseio.com https://*.firebaseapp.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://api.postalpincode.in https://api.zippopotam.us https://api.cashfree.com https://sandbox.cashfree.com https://*.cashfree.com;
  frame-src 'self' https://*.cashfree.com https://api.cashfree.com;
  worker-src 'self' blob:;
  manifest-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self' https://*.cashfree.com https://api.cashfree.com;
  frame-ancestors 'none';
`
  .replace(/\s{2,}/g, " ")
  .trim();

const nextConfig: NextConfig = {
  images: {
    loader: 'custom',
    loaderFile: './src/lib/imagekitLoader.ts',
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vzqlsawxvvyvsstyzzff.supabase.co",
      },
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
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
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: cspHeader,
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      {
        source: "/contact",
        destination: "/contact-us",
        permanent: true,
      },
      {
        source: "/faqs",
        destination: "/faq",
        permanent: true,
      },
      {
        source: "/shipping",
        destination: "/shipping-policy",
        permanent: true,
      },
      {
        source: "/returns",
        destination: "/returns-refunds",
        permanent: true,
      },
      {
        source: "/refund-policy",
        destination: "/returns-refunds",
        permanent: true,
      },
      {
        source: "/store-location",
        destination: "/our-store",
        permanent: true,
      },
    ];
  },
  experimental: {
    serverActions: {
      allowedOrigins,
    },
  },
};

export default nextConfig;
