import { fileURLToPath } from "node:url";

import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    // Generates src/routeTree.gen.ts from the files in src/routes.
    TanStackRouterVite({ routesDirectory: "src/routes", generatedRouteTree: "src/routeTree.gen.ts" }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    port: 5173,
    // Everything under /api, /uploads and /sitemap.xml goes to the Express server,
    // so the browser sees one origin and cookies just work.
    proxy: {
      "/api": { target: "http://localhost:4000", changeOrigin: true },
      "/uploads": { target: "http://localhost:4000", changeOrigin: true },
      "/sitemap.xml": { target: "http://localhost:4000", changeOrigin: true },
      "/robots.txt": { target: "http://localhost:4000", changeOrigin: true },
    },
  },
  build: { outDir: "dist", sourcemap: false },
});
