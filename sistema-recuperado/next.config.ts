import type { NextConfig } from "next";
import path from "path";

const isDev = process.env.NODE_ENV !== 'production';

const nextConfig: NextConfig = {
  // Only allow specific origins in development, restrict in production
  allowedDevOrigins: isDev ? ["localhost:3000"] : [],
  // Configure Turbopack for Next.js 16
  turbopack: {
    // Set the correct absolute root directory
    root: path.resolve(__dirname),
  },
  // Disable source maps in development to avoid console errors
  productionBrowserSourceMaps: false,
  // Increase body size limit for Server Actions (file uploads)
  experimental: {
    serverActions: {
      bodySizeLimit: '500mb',
    },
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Cache Control
          {
            key: "Cache-Control",
            value: "no-cache, no-store, must-revalidate",
          },
          // Prevent clickjacking attacks
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          // Prevent MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSS Protection (legacy browsers)
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Enforce HTTPS (1 year, include subdomains)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          // Control referrer information
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Disable unnecessary browser features
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
          },
          // Content Security Policy - Restrictive but allows Supabase
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.youtube.com *.vimeo.com", // Required for Next.js and Video Players
              "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
              "font-src 'self' fonts.gstatic.com",
              "img-src 'self' data: blob: *.supabase.co *.youtube.com *.vimeo.com images.unsplash.com api.dicebear.com",
              "media-src 'self' blob: *.supabase.co",
              "connect-src 'self' *.supabase.co wss://*.supabase.co",
              "frame-src 'self' *.youtube.com *.youtube-nocookie.com *.vimeo.com player.vimeo.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
