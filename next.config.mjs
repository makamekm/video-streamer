/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack(config, { isServer }) {
        config.module.rules.push({
            test: /\.svg$/,
            use: ["@svgr/webpack"]
        });

        config.resolve.fallback = { fs: false };
        
        return config;
    }
};

export default nextConfig;
