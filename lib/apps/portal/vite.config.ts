import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";
import svgLoader from "vite-svg-loader";

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    process: {
      env: {
        NODE_DEBUG: false,
      },
    },
    global: {},
  },
  plugins: [
    vue({
      reactivityTransform: true,
      template: {
        compilerOptions: {
          isCustomElement: (tag) => ['ion-icon'].includes(tag),
        }
      }
    }),
    svgLoader(),
  ],
  resolve: {
    alias: {
      "@truffle/contract": path.resolve(
        __dirname,
        "./node_modules/@truffle/contract/browser-dist/truffle-contract.js"
      ),
    },
  },
});
