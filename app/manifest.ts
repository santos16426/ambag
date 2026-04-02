import type { MetadataRoute } from "next";

const THEME_COLOR = "#FDFDFD";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ambag - Financial Management System",
    short_name: "Ambag",
    description:
      "Financial management system for businesses and organizations",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: THEME_COLOR,
    theme_color: THEME_COLOR,
    icons: [
      {
        src: "/logo.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
