import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TABLES = ['books', 'members', 'transactions', 'librarians'];
const OUTPUT_DIR = path.join(__dirname, 'exports');
const dbPath = path.join(__dirname, 'library.db');

const db = new sqlite3.Database(dbPath);
const dbAll = promisify(db.all.bind(db));

function toCsv(rows) {
  if (!rows.length) {
    return '';
  }

  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    if (value === null || value === undefined) {
      return '""';
    }
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const headerLine = headers.map(escape).join(',');
  const dataLines = rows.map((row) =>
    headers.map((header) => escape(row[header])).join(',')
  );

  return [headerLine, ...dataLines].join('\n');
}

async function exportTable(tableName) {
  const rows = await dbAll(`SELECT * FROM ${tableName}`);
  const csv = toCsv(rows);
  const filePath = path.join(OUTPUT_DIR, `${tableName}.csv`);
  await fs.writeFile(filePath, csv, 'utf8');
  console.log(`Exported ${rows.length} rows from ${tableName} to ${filePath}`);
}

async function exportDatabase() {
  try {
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    for (const table of TABLES) {
      await exportTable(table);
    }
    console.log('CSV export complete!');
  } catch (error) {
    console.error('Failed to export database:', error);
    process.exitCode = 1;
  } finally {
    db.close();
  }
}

exportDatabase();

