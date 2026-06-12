import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "firebasestorage.googleapis.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "eenadu.net" },
      { protocol: "https", hostname: "*.eenadu.net" },
      { protocol: "https", hostname: "sakshi.com" },
      { protocol: "https", hostname: "*.sakshi.com" },
      { protocol: "https", hostname: "sakshiresources.com" },
      { protocol: "https", hostname: "*.sakshiresources.com" },
      { protocol: "https", hostname: "andhrajyothy.com" },
      { protocol: "https", hostname: "*.andhrajyothy.com" },
      { protocol: "https", hostname: "news.google.com" },
      { protocol: "https", hostname: "*.googleusercontent.com" }
    ],
  },
  serverExternalPackages: ["firebase", "firebase-admin"],
};

export default nextConfig;
