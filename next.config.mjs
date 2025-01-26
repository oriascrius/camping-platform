/** @type {import('next').NextConfig} */
const nextConfig = {
  // 允許圖片來源
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '*',
        pathname: '/**',
      },
    ],
  },

  // 關閉嚴格模式
  reactStrictMode: false,

  // 設定打包輸出目錄
  distDir: '.next',

  // 啟用源碼映射
  productionBrowserSourceMaps: true,

  // 配置 webpack 處理字體文件
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(woff|woff2|eot|ttf|otf)$/i,
      type: 'asset/resource',
      generator: {
        filename: 'static/fonts/[name][ext]',
      },
    });
    return config;
  },

  // 設定路由重寫規則
  async rewrites() {
    return [
      {
        source: '/socket.io/:path*',
        destination: 'http://localhost:3002/socket.io/:path*',
      },
    ]
  },
}

export default nextConfig
