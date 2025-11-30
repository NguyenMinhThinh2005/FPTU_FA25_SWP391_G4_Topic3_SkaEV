import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./src/setupTests.js", "./vitest.setup.js"],
    globals: true,
    css: true,
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "src/components/customer/__tests__/BookingModal.test.jsx",
      "src/pages/customer/__tests__/ChargeControl.test.jsx"
    ],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: [
        "src/pages/auth/Login.jsx",
        "src/store/authStore.js",
        "src/store/bookingStore.js"
      ],
      exclude: [
        "src/main.jsx",
        "src/**/*.test.{js,jsx}",
        "src/tests/**",
        "src/**/__tests__/**"
      ]
    }
  }
});
