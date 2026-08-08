import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Workspace packages shipped as TypeScript source are transpiled by Next.
  transpilePackages: ["@provira/api-client"],
};

export default withNextIntl(nextConfig);
