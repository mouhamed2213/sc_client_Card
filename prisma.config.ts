import "dotenv/config";
import { defineConfig } from "prisma/config";
import { ENV } from "./server/_core/env";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: ENV.databaseUrl,
  },
});
console.log(ENV.databaseUrl)