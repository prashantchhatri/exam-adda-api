import { randomUUID } from 'crypto';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { Role } from '../src/common/enums/role.enum';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require')
    ? { rejectUnauthorized: false }
    : undefined,
});

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
