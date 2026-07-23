import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" makes all built asset URLs relative so the app works wherever the
// Lemma app host serves it (e.g. /public/apps/<slug>/), not just at the domain root.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 2500,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ["three", "@react-three/fiber", "@react-three/drei"],
          vendor: ["react", "react-dom", "lucide-react", "gsap"],
        },
      },
    },
  },
});
