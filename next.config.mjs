/** @type {import('next').NextConfig} */
const nextConfig = {
  // Railway 部署設定
  output: 'standalone',

  // 允許圖片來源
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*',  // 允許所有域名
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

  // 啟用壓縮
  swcMinify: true,

  // 其他常用配置選項：

  // 設定環境變數
  // env: {
  //   customKey: 'customValue',
  // },

  // 設定基礎路徑，如果網站不是部署在根目錄則需要配置
  // basePath: '/docs',

  // 設定重定向規則
  // async redirects() {
  //   return [
  //     {
  //       source: '/old-path',
  //       destination: '/new-path',
  //       permanent: true,  // 301 永久重定向
  //     },
  //   ]
  // },

  // 設定路由重寫規則
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: 'https://api.example.com/:path*',
  //     },
  //   ]
  // },

  // 配置 webpack
  // webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
  //   // 自定義 webpack 配置
  //   return config
  // },

  // 配置 headers
  // async headers() {
  //   return [
  //     {
  //       source: '/:path*',
  //       headers: [
  //         {
  //           key: 'X-Custom-Header',
  //           value: 'custom value',
  //         },
  //       ],
  //     },
  //   ]
  // },

  // 是否壓縮 HTML
  // minify: false,
}

export default nextConfig
