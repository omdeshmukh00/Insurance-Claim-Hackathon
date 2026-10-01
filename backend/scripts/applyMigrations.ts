import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not set in backend/.env');
  process.exit(1);
}

async function run() {
  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    console.log('Connecting to PostgreSQL database...');
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');

    const res = await client.query('SELECT current_database(), current_user, version();');
    console.log('Current DB info:', res.rows[0]);

    // Check existing tables
    const tableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('Existing public tables before run:', tableRes.rows.map(r => r.table_name));

    // Migrations to run
    const migrationFiles = [
      '001_initial_schema.sql',
      '002_rls_policies.sql',
      '003_seed_policies.sql',
      '004_user_policies.sql',
    ];

    for (const file of migrationFiles) {
      const filePath = path.resolve(__dirname, '../migrations', file);
      if (!fs.existsSync(filePath)) {
        console.warn(`Migration file ${file} does not exist at ${filePath}`);
        continue;
      }
      console.log(`Executing migration ${file}...`);
      const sql = fs.readFileSync(filePath, 'utf-8');
      try {
        await client.query(sql);
        console.log(`✓ Migration ${file} executed successfully.`);
      } catch (err: any) {
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log(`ℹ Migration ${file} note: ${err.message} (proceeding)`);
        } else {
          throw err;
        }
      }
    }

    // Check tables after migration
    const afterTableRes = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    console.log('\nPublic tables after all migrations:', afterTableRes.rows.map(r => r.table_name));

    // Verify row counts in key tables
    const profileCount = await client.query('SELECT count(*) FROM profiles;');
    console.log('Profiles count:', profileCount.rows[0].count);

    const userPoliciesCount = await client.query('SELECT count(*) FROM user_policies;');
    console.log('User policies count:', userPoliciesCount.rows[0].count);

    // List sample user policies
    const samplePolicies = await client.query('SELECT id, policy_number, insurer_name, policyholder_name, status FROM user_policies LIMIT 5;');
    console.log('Sample user policies in DB:', samplePolicies.rows);

    await client.end();
    console.log('\nSUCCESS: All migrations applied and verified in Supabase PostgreSQL!');
  } catch (err: any) {
    console.error('Database execution error:', err.message, err.stack);
    await client.end().catch(() => {});
    process.exit(1);
  }
}

run();
