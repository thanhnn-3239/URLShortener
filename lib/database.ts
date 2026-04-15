import { Pool, type QueryResultRow } from "pg";
import { validateEnvironment } from "./envValidation";
import { ConfigurationError } from "./errors";

type Primitive = string | number | boolean | null;
type Row = Record<string, Primitive>;

const tables = new Map<string, Row[]>();
const IDENTIFIER_PATTERN = /^[a-z_][a-z0-9_]*$/i;
let pool: Pool | null = null;

/**
 * Environment validation happens at module import time (not lazily)
 * This ensures fail-fast on misconfigurations during app startup
 * For local development (NODE_ENV=test or no DATABASE_URL), validation is skipped
 */
function validateEnvAtStartup() {
  const shouldUseInMemory =
    process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;

  if (!shouldUseInMemory) {
    try {
      const profile = validateEnvironment();
      // Log validation success to track startup
      console.log(
        `[db] Environment validated for ${profile.environmentType} deployment`
      );
    } catch (error) {
      // Log critical errors to stderr before throwing
      if (error instanceof ConfigurationError) {
        console.error("[db] CRITICAL: Configuration validation failed");
        console.error(`[db] Code: ${error.configCode}`);
        console.error(`[db] Variable: ${error.variable}`);
        console.error(`[db] Message: ${error.message}`);
        console.error(`[db] Hint: ${error.hint}`);
        console.error(`[db] Location: ${error.location}`);
      } else if (error instanceof Error) {
        console.error("[db] CRITICAL: Environment validation error:", error.message);
      }
      throw error;
    }
  }
}

// Validate environment at module load time
validateEnvAtStartup();

function shouldUseInMemoryDatabase() {
  return process.env.NODE_ENV === "test" || !process.env.DATABASE_URL;
}

function assertIdentifier(value: string) {
  if (!IDENTIFIER_PATTERN.test(value)) {
    throw new Error(`Unsafe SQL identifier: ${value}`);
  }

  return `"${value}"`;
}

function normalizeRow(row: QueryResultRow): Row {
  return Object.fromEntries(
    Object.entries(row).map(([key, value]) => {
      if (value instanceof Date) {
        return [key, value.toISOString()];
      }

      if (typeof value === "bigint") {
        return [key, Number(value)];
      }

      return [key, value as Primitive];
    })
  );
}

function getPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30_000
    });
  }

  return pool;
}

async function queryRows(queryText: string, values: Primitive[] = []) {
  const result = await getPool().query(queryText, values);
  return result.rows.map(normalizeRow);
}

function selectFromMemory(table: string, where?: Partial<Row>): Row[] {
  const rows = tables.get(table) ?? [];

  if (!where) {
    return [...rows];
  }

  return rows.filter((row) =>
    Object.entries(where).every(([key, value]) => row[key] === value)
  );
}

export async function select(
  table: string,
  where?: Partial<Row>
): Promise<Row[]> {
  if (shouldUseInMemoryDatabase()) {
    return selectFromMemory(table, where);
  }

  const tableName = assertIdentifier(table);

  if (!where || Object.keys(where).length === 0) {
    return queryRows(`SELECT * FROM ${tableName}`);
  }

  const keys = Object.keys(where);
  const conditions = keys
    .map((key, index) => `${assertIdentifier(key)} = $${index + 1}`)
    .join(" AND ");
  const values = keys.map((key) => (where[key] ?? null) as Primitive);

  return queryRows(`SELECT * FROM ${tableName} WHERE ${conditions}`, values);
}

export async function insert(table: string, row: Row): Promise<Row> {
  if (shouldUseInMemoryDatabase()) {
    const rows = tables.get(table) ?? [];
    rows.push(row);
    tables.set(table, rows);
    return row;
  }

  const keys = Object.keys(row);
  const tableName = assertIdentifier(table);
  const columns = keys.map(assertIdentifier).join(", ");
  const placeholders = keys.map((_, index) => `$${index + 1}`).join(", ");
  const values = keys.map((key) => row[key] ?? null);
  const [createdRow] = await queryRows(
    `INSERT INTO ${tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
    values
  );

  return createdRow;
}

export async function update(
  table: string,
  where: Partial<Row>,
  patch: Partial<Row>
): Promise<number> {
  if (shouldUseInMemoryDatabase()) {
    const rows = tables.get(table) ?? [];
    let count = 0;

    for (const row of rows) {
      if (Object.entries(where).every(([key, value]) => row[key] === value)) {
        Object.assign(row, patch);
        count += 1;
      }
    }

    return count;
  }

  const patchKeys = Object.keys(patch);
  const whereKeys = Object.keys(where);

  if (patchKeys.length === 0 || whereKeys.length === 0) {
    return 0;
  }

  const tableName = assertIdentifier(table);
  const setClause = patchKeys
    .map((key, index) => `${assertIdentifier(key)} = $${index + 1}`)
    .join(", ");
  const whereClause = whereKeys
    .map(
      (key, index) =>
        `${assertIdentifier(key)} = $${patchKeys.length + index + 1}`
    )
    .join(" AND ");
  const values = [
    ...patchKeys.map((key) => (patch[key] ?? null) as Primitive),
    ...whereKeys.map((key) => (where[key] ?? null) as Primitive)
  ];

  const result = await getPool().query(
    `UPDATE ${tableName} SET ${setClause} WHERE ${whereClause}`,
    values
  );
  return result.rowCount ?? 0;
}

export async function upsert(
  table: string,
  where: Partial<Row>,
  row: Row
): Promise<Row> {
  const existing = await select(table, where);

  if (existing.length > 0) {
    await update(table, where, row);
    return { ...existing[0], ...row };
  }

  return insert(table, row);
}

export async function replaceTable(table: string, rows: Row[]): Promise<void> {
  if (shouldUseInMemoryDatabase()) {
    tables.set(table, [...rows]);
    return;
  }

  const tableName = assertIdentifier(table);

  if (table.endsWith("_mv")) {
    await getPool().query(`REFRESH MATERIALIZED VIEW ${tableName}`);
    return;
  }

  await getPool().query(`DELETE FROM ${tableName}`);

  for (const row of rows) {
    await insert(table, row);
  }
}

export function resetTables() {
  tables.clear();
}

/**
 * Execute a raw SQL query
 * Used by health check endpoint and other specialized queries
 * In test environment, returns a simple success indicator
 */
export async function query(queryText: string, values: Primitive[] = []): Promise<Row[]> {
  if (shouldUseInMemoryDatabase()) {
    // In test mode, return a mock result
    return [{ "?column?": 1 }];
  }

  return queryRows(queryText, values);
}
