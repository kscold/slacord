/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    transpilePackages: ['@blocknote/core', '@blocknote/react'],
    async rewrites() {
        const destination = `${process.env.INTERNAL_API_URL || 'http://127.0.0.1:8082'}/api/:path*`;

        return [
            {
                source: '/api/:path*',
                destination,
            },
        ];
    },
};

module.exports = nextConfig;
