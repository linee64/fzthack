import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";
import { existsSync } from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const srcPath = resolve(__dirname, "src");

const EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs"];

// Custom plugin that resolves @/ aliases WITH proper extension inference.
// This is required because vite-tsconfig-paths returns paths without extensions
// from virtual TanStack Router split files, causing vite:load-fallback to fail.
const resolveAtAlias = {
  name: "resolve-at-alias",
  enforce: "pre" as const,
  resolveId(id: string) {
    if (!id.startsWith("@/")) return;
    const withoutAlias = id.slice(2); // remove "@/"
    const base = resolve(srcPath, withoutAlias);

    // Already has extension
    if (EXTENSIONS.some((ext) => id.endsWith(ext)) && existsSync(base)) {
      return base;
    }

    // Try adding each extension
    for (const ext of EXTENSIONS) {
      if (existsSync(base + ext)) return base + ext;
    }

    // Try as directory index
    for (const ext of EXTENSIONS) {
      const indexPath = resolve(base, "index" + ext);
      if (existsSync(indexPath)) return indexPath;
    }

    // Return base anyway (let other resolvers handle it)
    return base;
  },
};

export default defineConfig({
  plugins: [
    resolveAtAlias,
    tailwindcss(),
    tanstackStart(),
    react(),
  ],
  resolve: {
    extensions: EXTENSIONS,
  },
});
