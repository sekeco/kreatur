import { ZenStackClient } from "@zenstackhq/orm"
import { PostgresDialect } from "@zenstackhq/orm/dialects/postgres"
import { Pool } from "pg"
import { schema } from "../../zenstack/schema"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = new ZenStackClient(schema, {
  dialect: new PostgresDialect({ pool }),
  // log: process.env.NODE_ENV === "development" ? ["query", "error"] : ["error"],
})

export type DB = typeof db
