import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    server: { entry: "server" },
  },
  nitro: {
    // Workaround: the cloudflare-module preset's default vendor-chunk splitting
    // (via Rolldown) currently ships a broken `__exportAll` helper reference in
    // this nitro beta, causing a runtime TypeError on every request. Bundling
    // everything into a single file avoids the chunk boundary entirely.
    // Must go through rolldownConfig specifically — the preset hard-codes
    // inlineDynamicImports:false in its own rollupConfig, which otherwise wins.
    rolldownConfig: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});