import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Treat .js files as JSX (for compatibility with CRA projects)
  esbuild: {
    loader: "jsx",
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        ".js": "jsx",
        ".jsx": "jsx",
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    // Proxy API requests to backend during development
    proxy: {
      "/api": {
        target: "http://localhost:5050",
        changeOrigin: true,
        secure: false,
      },
      "/socket.io": {
        target: "http://localhost:5050",
        changeOrigin: true,
        ws: true,
      },
    },
  },
  build: {
    outDir: "build",
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom", "react-router-dom"],
          antd: ["antd", "@ant-design/icons", "@ant-design/cssinjs"],
          motion: ["framer-motion"],
          socket: ["socket.io-client"],
        },
      },
    },
  },
  // Define global constants
  define: {
    // Support for process.env.NODE_ENV (for libraries that use it)
    "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV || "development"),
  },
});
