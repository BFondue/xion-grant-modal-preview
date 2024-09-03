/** @type {import('next').NextConfig} */
module.exports = {
  output: process.env.NEXT_CONFIG_OUTPUT || null,
  webpack(config) {
    // Resolve " Module not found: Can't resolve 'pino-pretty' in " warning coming from wallet-connect
    config.externals.push("pino-pretty", "lokijs", "encoding");

    return config;
  },
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "www.okx.com",
        port: "",
        pathname: "/cdn/assets/imgs/239/*",
      },
    ],
  },
};
