import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Also set this for the server
    api: {
        bodyParser: {
            sizeLimit: '200mb',
        },
        responseLimit: false,
    },
};

export default nextConfig;
