import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getPool } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  try {
    const pool = getPool();
    const sql = fs.readFileSync(
      path.join(__dirname, 'migrations.sql'),
      'utf8'
    );
    
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      await pool.execute(statement);
    }

    console.log('✅ Migraciones ejecutadas correctamente');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error ejecutando migraciones:', error);
    process.exit(1);
  }
}

runMigrations();

