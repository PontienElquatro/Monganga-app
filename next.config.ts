import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  // La caméra et le micro ne sont autorisés que pour la salle de visio (Daily.co, dans une iframe).
  { key: "Permissions-Policy", value: "camera=(self \"https://*.daily.co\"), microphone=(self \"https://*.daily.co\"), geolocation=()" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Le logo est lu sur le disque pour le PDF de l'ordonnance.
  outputFileTracingIncludes: { "/api/ordonnances/[id]/pdf": ["./public/logo/monganga-icon-192.png"] },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  experimental: {
    serverActions: { bodySizeLimit: "12mb" },
  },
};

export default nextConfig;
