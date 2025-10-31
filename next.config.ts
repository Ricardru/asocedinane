import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Facilita ejecución en Docker/PM2 usando salida standalone
  output: 'standalone',
  // Si en el futuro usas next/image con dominios remotos, agrega aquí los patrones
  // images: { remotePatterns: [{ protocol: 'https', hostname: '**' }] }
};

export default nextConfig;
