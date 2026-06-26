import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CementPro MES",
    short_name: "CementPro",
    description:
      "Enterprise manufacturing execution system for cement and precast production.",
    start_url: "/",
    display: "standalone",
    background_color: "#0f172a",
    theme_color: "#0369a1",
    orientation: "any",
    icons: [
      {
        src: "/cement_factory.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/cement_factory.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
