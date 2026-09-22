import "dotenv/config";
import { defineConfig } from "prisma/config";
import { ENV } from "./server/_core/env";

export default defineConfig({
  schema: "server/database/prisma/schema.prisma", // ← chemin corrigé
  migrations: {
    path: "server/database/prisma/migrations",
  },
  datasource: {
    url: ENV.databaseUrl,
  },
});
console.log(ENV.databaseUrl);
