import type { NextConfig } from "next";

// Server-side rewrite ต้องชี้ตรงไป backend container (ไม่ผ่าน nginx/public URL)
// INTERNAL_BACKEND_URL ใช้สำหรับ server-side rewrites เท่านั้น
const internalBackend =
  process.env.INTERNAL_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:5000";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: "/uploads/:path*",
        destination: `${internalBackend}/uploads/:path*`,
      },
    ];
  },
};

export default nextConfig;
