// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.

import fs from "node:fs";
import path from "node:path";

import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { mcpPlugin } from "@lovable.dev/mcp-js/stacks/tanstack/vite";
import { loadEnv } from "vite";

// Remove any 0-byte generated route files that would block @lovable.dev/mcp-js or TanStack Router
const generatedFiles = [
  "src/routes/mcp.ts",
  "src/routes/[.mcp]/list-tools.ts",
  "src/routes/[.mcp]/invoke-tool/$tool.ts",
  "src/routes/[.well-known]/oauth-protected-resource.ts",
  "src/routeTree.gen.ts",
];
for (const relPath of generatedFiles) {
  const fullPath = path.resolve(process.cwd(), relPath);
  try {
    const stat = fs.statSync(fullPath);
    if (stat.isFile() && stat.size === 0) {
      fs.unlinkSync(fullPath);
    }
  } catch {
    // File doesn't exist, ignore
  }
}

// Server-side routes (email webhooks/previews) read non-VITE_ env vars from
// process.env. Load them here without overriding values already injected.
const serverEnv = loadEnv(process.env["NODE_ENV"] ?? "development", process.cwd(), "");
for (const [key, value] of Object.entries(serverEnv)) {
  if (process.env[key] === undefined) process.env[key] = value;
}

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled entries to src/server.ts and src/client.tsx
    server: { entry: "server" },
    client: { entry: "client" },
  },
  nitro: {
    preset: "node-server",
    rolldownConfig: {
      checks: {
        moduleLevelDirective: false,
      },
      onwarn(warning: { code?: string }, warn: (w: unknown) => void) {
        if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
          return;
        }
        warn(warning);
      },
    },
  },
  vite: {
    server: {
      host: "0.0.0.0",
      port: 3000,
      strictPort: true,
    },
    plugins: [mcpPlugin()],
    optimizeDeps: {
      rolldownOptions: {
        checks: {
          moduleLevelDirective: false,
        },
      },
    },
    build: {
      rolldownOptions: {
        checks: {
          moduleLevelDirective: false,
        },
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
      rollupOptions: {
        onwarn(warning, warn) {
          if (warning.code === "MODULE_LEVEL_DIRECTIVE") {
            return;
          }
          warn(warning);
        },
      },
    },
    resolve: {
      alias: {
        // React Email needs entities v4.5.0; nested v7 copies drop ./lib/decode.js.
        "entities/lib/decode.js": path.resolve(
          process.cwd(),
          "node_modules/entities/lib/decode.js",
        ),
        "entities/lib/encode.js": path.resolve(
          process.cwd(),
          "node_modules/entities/lib/encode.js",
        ),
        entities: path.resolve(process.cwd(), "node_modules/entities"),
      },
    },
  },
});
