import { defineConfig } from "prisma/config";

export default defineConfig({
  hooks: {
    seed: "node prisma/seed.js",
  },
});
