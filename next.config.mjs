/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: (config, { isServer }) => {
        if (isServer) {
            config.externals.push('firebase-admin');
        }
        return config;
    }
};

export default nextConfig;
