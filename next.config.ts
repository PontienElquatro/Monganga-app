import type { NextConfig } from "next";
import legacyRedirects from "./config/legacy-redirects.json";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // Anciennes adresses *.html du front -> routes sans extension.
  async redirects() {
    return legacyRedirects;
  },
};

export default nextConfig;
