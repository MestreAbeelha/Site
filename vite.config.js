import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // caminho relativo: funciona hospedado em github.io/seu-repo/ sem precisar configurar nada
});
