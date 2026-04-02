import fs from 'fs'
import path from 'path'
import pg from 'pg'
import pool from './db.js'

const migrationsDir = path.resolve('sql', 'migrations')

const ensureMigrationsTable = async () => {
  await pool.query(`
    create table if not exists migrations (
      id serial primary key,
      filename text not null unique,
      applied_at timestamptz not null default now()
    )
  `)
}

const ensureDatabase = async () => {
  try {
    await pool.query('select 1')
    return
  } catch (err) {
    if (err.code !== '3D000') throw err
  }

  const adminDb = process.env.DB_ADMIN_DB || 'postgres'
  const client = new pg.Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 5432),
    database: adminDb,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
  })
  await client.connect()
  const dbName = process.env.DB_NAME || 'tattoo22'
  try {
    await client.query(`create database ${dbName}`)
  } catch (err) {
    if (err.code !== '42P04') {
      throw err
    }
  }
  await client.end()
}

const getApplied = async () => {
  const result = await pool.query('select filename from migrations')
  return new Set(result.rows.map((r) => r.filename))
}

const run = async () => {
  await ensureDatabase()
  await ensureMigrationsTable()
  const applied = await getApplied()

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    if (sql.trim().length === 0) continue
    console.log(`Applying ${file}...`)
    await pool.query('begin')
    try {
      await pool.query(sql)
      await pool.query('insert into migrations (filename) values ($1)', [file])
      await pool.query('commit')
    } catch (err) {
      await pool.query('rollback')
      console.error(`Failed ${file}:`, err.message)
      process.exit(1)
    }
  }

  console.log('Migrations complete')
  process.exit(0)
}

run()
