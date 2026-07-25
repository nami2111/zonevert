import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { fileURLToPath, URL } from "node:url";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const root = fileURLToPath(new URL(".", import.meta.url));
const pkg = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));

export default defineConfig({
  plugins: [svelte()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  // Tauri expects a fixed port; Vite's default is 5173.
  server: {
    port: 5173,
    strictPort: true,
  },
  clearScreen: false,
  resolve: {
    alias: {
      // `$lib` alias so components import from `$lib/bindings`, `$lib/logic/...`
      // — matches the SvelteKit convention without needing SvelteKit.
      $lib: fileURLToPath(new URL("./src/lib", import.meta.url)),
    },
  },
});
