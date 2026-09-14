/// <reference path="./.sst/platform/config.d.ts" />
export default $config({
  app(input) {
    return {
      name: "spar-networking",
      home: "aws",
      removal: input?.stage === "production" ? "retain" : "remove",
      protect: input?.stage === "production",
      providers: { aws: { region: "us-east-1" } },
    };
  },
  async run() {
    const site = new sst.aws.StaticSite("Web", {
      domain:
        !$dev && $app.stage === "production"
          ? "spar2026.trekkit.io"
          : undefined,
      build: { command: "npm run build", output: "dist" },
      dev: { command: "npm run dev" },
      environment: {
        VITE_PUBLIC_MAPBOX_TOKEN: $dev
          ? process.env.MapboxAccessToken ?? ""
          : process.env.MapboxAccessTokenProd ?? "",
      },
    });
    return { url: site.url };
  },
});
