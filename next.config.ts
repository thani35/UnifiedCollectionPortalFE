import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "Content-Security-Policy",
    value: `
      default -src * data: blob: 'unsafe-inline' 'unsafe-eval';
      script - src * data: blob: 'unsafe-inline' 'unsafe-eval';
      style - src * data: blob: 'unsafe-inline';
      img - src * data: blob: ;
      connect - src *;
      frame - src *;
      font - src * data: ;
      frame - ancestors *;
      form - action *;
      `.replace(/\s{2,}/g, ' ').trim(),
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
    value: "camera=(), microphone=(), geolocation=()",
  }
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
