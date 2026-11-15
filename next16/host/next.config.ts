import type { NextConfig } from "next";

// Note what's NOT here: no webpack() hook, no ModuleFederationPlugin, no asset patching.
// The host is a plain Turbopack Next 16 app; federation happens entirely at runtime.
const nextConfig: NextConfig = {};

export default nextConfig;
