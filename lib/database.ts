type Primitive = string | number | boolean | null;
type Row = Record<string, Primitive>;

const tables = new Map<string, Row[]>();

export async function select(table: string, where?: Partial<Row>): Promise<Row[]> {
  const rows = tables.get(table) ?? [];

  if (!where) {
    return [...rows];
  }

  return rows.filter((row) => Object.entries(where).every(([key, value]) => row[key] === value));
}

export async function insert(table: string, row: Row): Promise<Row> {
  const rows = tables.get(table) ?? [];
  rows.push(row);
  tables.set(table, rows);
  return row;
}

export async function update(table: string, where: Partial<Row>, patch: Partial<Row>): Promise<number> {
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

export async function upsert(table: string, where: Partial<Row>, row: Row): Promise<Row> {
  const existing = await select(table, where);

  if (existing.length > 0) {
    await update(table, where, row);
    return { ...existing[0], ...row };
  }

  return insert(table, row);
}

export function resetTables() {
  tables.clear();
}
