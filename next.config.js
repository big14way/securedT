/** @type {import('next').NextConfig} */

const nextConfig = {
    images: {
        unoptimized: true,
    },
    webpack: (config) => {
        config.externals = config.externals || [];
        config.externals.push({ hardhat: "hardhat" });
        return config;
    },
    // Remove custom distDir for Vercel compatibility
    // distDir: 'build',
}

module.exports = nextConfig
