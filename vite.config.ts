import { defineConfig } from "@tanstack/react-start/config";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";

export default defineConfig({
  vite: {
    plugins: [TanStackRouterVite({ autoCodeSplitting: true })],
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
