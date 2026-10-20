import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { inlineIcons } from "./scripts/inline-icons";

// GitHub Pages는 레포 이름 아래에 올린다 — leehwon0217.github.io/adsum-landing/
export default defineConfig({
  base: "./",
  plugins: [tailwindcss(), inlineIcons()],
  build: { outDir: "dist", emptyOutDir: true },
});
