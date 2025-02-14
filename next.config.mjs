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

  // 嚴格模式
  reactStrictMode: true,

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
        destination: process.env.NODE_ENV === 'production'
          ? 'https://camping-platform-production.up.railway.app/socket.io/:path*'
          : 'http://localhost:3002/socket.io/:path*',
      },
    ]
  },

  // 添加 CORS 和快取控制標頭
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: '*'
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ],
      },
    ]
  },

  // 更新實驗性功能配置
  experimental: {
    // 優化 CSS 載入
    optimizeCss: true,
    // 改善捲動行為
    scrollRestoration: true,
  },

  // 移除過時的配置
  compress: true,
  poweredByHeader: false,
}

export default nextConfig
