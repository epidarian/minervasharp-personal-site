import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { cloudflare } from "@cloudflare/vite-plugin";
import contentCollections from "@content-collections/vite";

const githubPages = process.env.GITHUB_PAGES === "true";

export default defineConfig({
  base: githubPages ? "/minervasharp-personal-site/" : "/",
  plugins: [
    contentCollections(),
    react(),
    ...(githubPages ? [] : [cloudflare()]),
  ],
  build: githubPages
    ? {
        outDir: "dist",
        emptyOutDir: true,
      }
    : undefined,
});
