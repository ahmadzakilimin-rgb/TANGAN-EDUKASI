import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  base: command === "build" && !process.env.VERCEL ? "/tanganedukasi/" : "/",
  publicDir: process.env.VERCEL ? false : "public",
  define: {
    "import.meta.env.VITE_CLEAN_LOGS_API": JSON.stringify(
      process.env.VERCEL ? "/api/clean-logs" : "",
    ),
  },
  plugins: [react(), tailwindcss()],
}));
