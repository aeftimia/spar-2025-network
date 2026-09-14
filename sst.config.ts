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
          ? "spar2025.trekkit.io"
          : undefined,
      build: { command: "npm run build", output: "dist" },
      dev: { command: "npm run dev" },
    });
    return { url: site.url };
  },
});
