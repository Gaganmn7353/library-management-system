import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'library.db');
const OUTPUT_DIR = path.join(__dirname, 'exports');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'library.sql');

const db = new sqlite3.Database(dbPath);
const dbAll = promisify(db.all.bind(db));

const TABLES_QUERY = `
  SELECT name, sql
  FROM sqlite_master
  WHERE type = 'table'
    AND name NOT LIKE 'sqlite_%'
  ORDER BY name
`;

function escapeValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return value;
  }
  const str = String(value).replace(/'/g, "''");
  return `'${str}'`;
}

function buildInsertStatement(table, row) {
  const columns = Object.keys(row);
  const values = columns.map((col) => escapeValue(row[col]));
  return `INSERT INTO "${table}" (${columns.map((c) => `"${c}"`).join(', ')}) VALUES (${values.join(', ')});`;
}

async function exportSql() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });

    const tables = await dbAll(TABLES_QUERY);
    let statements = [];

    statements.push('PRAGMA foreign_keys=OFF;');
    statements.push('BEGIN TRANSACTION;');

    for (const table of tables) {
      statements.push(`DROP TABLE IF EXISTS "${table.name}";`);
      statements.push(`${table.sql};`);

      const rows = await dbAll(`SELECT * FROM "${table.name}"`);
      if (rows.length) {
        rows.forEach((row) => {
          statements.push(buildInsertStatement(table.name, row));
        });
      }
    }

    statements.push('COMMIT;');

    await fs.writeFile(OUTPUT_FILE, statements.join('\n') + '\n', 'utf8');
    console.log(`Exported SQL dump to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error('Failed to export SQL:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

exportSql();

