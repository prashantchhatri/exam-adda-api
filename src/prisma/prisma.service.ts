import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool, PoolClient, QueryResult } from 'pg';

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly pool: Pool;
  private readonly dbHost: string;

  constructor() {
    const databaseUrl = this.getDatabaseUrl();
    const parsed = this.parseDatabaseUrl(databaseUrl);
    this.dbHost = parsed.host;
    this.pool = new Pool({
      host: parsed.host,
      port: parsed.port,
      user: parsed.user,
      password: parsed.password,
      database: parsed.database,
      ssl: databaseUrl?.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : undefined,
    });
  }

  async onModuleInit() {
    // Helpful runtime signal to confirm target DB host.
    // eslint-disable-next-line no-console
    console.log(`DB target host: ${this.dbHost}`);
    await this.pool.query('SELECT 1');
    await this.bootstrapTables();
  }

  async onModuleDestroy() {
    await this.pool.end();
  }

  query<T = unknown>(text: string, params: unknown[] = []) {
    return this.pool.query<T>(text, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private async bootstrapTables() {
    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT NOT NULL,
        full_name TEXT,
        phone TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await this.pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS full_name TEXT;');
    await this.pool.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT;');

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS institutes (
        id UUID PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        owner_id UUID UNIQUE NOT NULL REFERENCES users(id),
        logo_url TEXT,
        address TEXT,
        phone TEXT,
        show_info_on_login BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    await this.pool.query('ALTER TABLE institutes ADD COLUMN IF NOT EXISTS slug TEXT;');
    await this.pool.query('ALTER TABLE institutes ADD COLUMN IF NOT EXISTS logo_url TEXT;');
    await this.pool.query('ALTER TABLE institutes ADD COLUMN IF NOT EXISTS address TEXT;');
    await this.pool.query('ALTER TABLE institutes ADD COLUMN IF NOT EXISTS phone TEXT;');
    await this.pool.query('ALTER TABLE institutes ADD COLUMN IF NOT EXISTS show_info_on_login BOOLEAN DEFAULT FALSE;');
    await this.pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS institutes_slug_unique_idx
      ON institutes (slug)
      WHERE slug IS NOT NULL;
    `);

    await this.pool.query(`
      CREATE TABLE IF NOT EXISTS student_profiles (
        user_id UUID PRIMARY KEY REFERENCES users(id),
        institute_id UUID NOT NULL REFERENCES institutes(id),
        full_name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
  }

  private getDatabaseUrl() {
    if (process.env.DATABASE_URL) return process.env.DATABASE_URL;

    const envPath = join(process.cwd(), '.env');
    if (!existsSync(envPath)) return undefined;

    const content = readFileSync(envPath, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      if (!trimmed.startsWith('DATABASE_URL=')) continue;
      const raw = trimmed.slice('DATABASE_URL='.length).trim();
      const value = raw.replace(/^"(.*)"$/, '$1').replace(/^'(.*)'$/, '$1');
      return value;
    }
    return undefined;
  }

  private parseDatabaseUrl(databaseUrl?: string) {
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is missing');
    }
    const url = new URL(databaseUrl);
    const database = url.pathname.replace(/^\//, '');
    return {
      host: url.hostname,
      port: Number(url.port || '5432'),
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  }
}
