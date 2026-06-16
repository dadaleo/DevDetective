/** @type {import('next').NextConfig} */
const nextConfig = {
  // sql.js 是 WASM 模块，必须排除在 webpack 打包之外
  experimental: {
    serverComponentsExternalPackages: ["sql.js"],
  },
};

export default nextConfig;
