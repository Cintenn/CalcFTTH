import { pool } from "@workspace/db";
import bcrypt from "bcryptjs";
import { logger } from "./logger";

export async function initDb() {
  logger.info("Starting database initialization...");

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create enum type for role
    await client.query(`
      DO $$ BEGIN
        CREATE TYPE role AS ENUM ('super_admin', 'user');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // 2. Create users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT UNIQUE NOT NULL,
        email TEXT,
        password_hash TEXT NOT NULL,
        role role NOT NULL DEFAULT 'user',
        device_fingerprint TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    // 3. Create projects table
    await client.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        project_name TEXT NOT NULL,
        calculation_type TEXT NOT NULL,
        inputs JSON NOT NULL,
        results JSON NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    logger.info("Database initialized with raw SQL successfully; Tables verified.");

    // 4. Clean implementation: Remove any previous incorrect plaintext password entries
    await client.query(`
      DELETE FROM users 
      WHERE password_hash NOT LIKE '$2a$%' 
        AND password_hash NOT LIKE '$2b$%' 
        AND password_hash NOT LIKE '$2y$%'
    `);
    logger.info("Checked and removed any invalid plaintext password entries");

    // 5. Seed or update the default admin user
    const adminUsername = process.env.ADMIN_USERNAME || "maul";
    const adminPassword = process.env.ADMIN_PASSWORD;
    
    if (!adminPassword) {
      throw new Error("ADMIN_PASSWORD environment variable is required for database initialization");
    }
    
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(adminPassword, saltRounds);

    await client.query(
      `
      INSERT INTO users (username, password_hash, role) 
      VALUES ($1, $2, 'super_admin')
      ON CONFLICT (username) DO UPDATE 
      SET password_hash = EXCLUDED.password_hash, role = 'super_admin'
      `,
      [adminUsername, hashedPassword]
    );

    logger.info(`Admin user "${adminUsername}" ready and password hash updated.`);

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    logger.error({ err }, "Failed to initialize database schema");
    throw err;
  } finally {
    client.release();
  }
}
