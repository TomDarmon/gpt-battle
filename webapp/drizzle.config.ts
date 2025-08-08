import { defineConfig } from "drizzle-kit";
import { env } from "~/env";

export default defineConfig({
  out: "./drizzle",
  // Point directly to your table definition files so changes are detected
  schema: "./src/server/db/**/*.ts",
  dialect: "postgresql",
  dbCredentials: {
    // Read from process.env to avoid path alias issues in the CLI
    url: env.DATABASE_URL,
  },
});
