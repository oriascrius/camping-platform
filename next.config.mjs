/** @type {import('next').NextConfig} */
const nextConfig = {
  // 添加 output 設定，給予 Railway 使用
  output: 'standalone',

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',  // 替換成你需要的域名
        pathname: '/**',  // /** 表示允許所有路徑
      },
    ],
  },
// 先關閉
  reactStrictMode: false,

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

  // 設定打包輸出目錄
  // distDir: 'build',

  // 是否生成 source maps
  // productionBrowserSourceMaps: true,

  // 是否壓縮 HTML
  // minify: false,
}

export default nextConfig
