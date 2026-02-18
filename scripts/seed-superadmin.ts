import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Role } from '../src/common/enums/role.enum';

function getDatabaseUrl() {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

  const envPath = join(process.cwd(), '.env');
  if (!existsSync(envPath)) return undefined;

  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    if (!trimmed.startsWith('DATABASE_URL=')) continue;
    const raw = trimmed.slice('DATABASE_URL='.length).trim();
    return raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
  }
  return undefined;
}

function createPool(databaseUrl?: string) {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing');
  }

  const parsed = new URL(databaseUrl);
  const database = parsed.pathname.replace(/^\//, '');

  return new Pool({
    host: parsed.hostname,
    port: Number(parsed.port || '5432'),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
    database,
    ssl: databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
  });
}

const databaseUrl = getDatabaseUrl();
const pool = createPool(databaseUrl);

async function main() {
  const email = 'pkumarchhatri@gmail.com';
  const password = 'Prashant@123';
  const passwordHash = await bcrypt.hash(password, 10);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `);

  await pool.query('DELETE FROM users WHERE email = $1', [email]);
  await pool.query(
    `
      INSERT INTO users (id, email, password, role)
      VALUES ($1::uuid, $2, $3, $4)
    `,
    [randomUUID(), email, passwordHash, Role.SUPER_ADMIN],
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
