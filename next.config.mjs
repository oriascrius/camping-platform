/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'example.com',  // 替換成你需要的域名
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
