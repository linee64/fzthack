import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPath = resolve(__dirname, "src");

export default defineConfig({
  plugins: [
    tailwindcss(),
    tanstackStart(),
    react(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      "@": srcPath,
    },
    extensions: [".ts", ".tsx", ".mjs", ".js", ".jsx", ".json"],
  },
});
