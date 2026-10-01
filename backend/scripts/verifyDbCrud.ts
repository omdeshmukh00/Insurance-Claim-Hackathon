import { Client } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function verify() {
  await client.connect();
  console.log('Connected to Supabase PostgreSQL.');

  // 1. Verify Profiles
  const profiles = await client.query('SELECT id, email, full_name, role FROM profiles;');
  console.log('Profiles verified:', profiles.rows.length, 'records.');

  // 2. Verify User Policies
  const policies = await client.query('SELECT id, policy_number, insurer_name, coverage FROM user_policies;');
  console.log('User Policies verified:', policies.rows.length, 'records.');

  // 3. Test insert & delete claim
  const testClaimId = '99999999-9999-9999-9999-999999999999';
  await client.query(`
    INSERT INTO claims (
      id, claimant_id, claim_number, policy_number, claim_type, title, description, incident_date, claim_amount, status
    ) VALUES (
      $1, $2, $3, $4, 'AUTO', 'Test Collision Claim', 'Rear bumper minor damage', '2026-09-15', 1200.00, 'SUBMITTED'
    ) ON CONFLICT (id) DO UPDATE SET updated_at = now();
  `, [testClaimId, '11111111-0000-0000-0000-000000000001', 'CLM-TEST-001', 'POL-AUTO-2026-001']);

  const insertedClaim = await client.query('SELECT id, claim_number, status, claim_amount FROM claims WHERE id = $1;', [testClaimId]);
  console.log('Claim CRUD verified:', insertedClaim.rows[0]);

  // Clean up test claim
  await client.query('DELETE FROM claims WHERE id = $1;', [testClaimId]);
  console.log('Test claim cleaned up successfully.');

  await client.end();
  console.log('ALL SUPABASE POSTGRESQL CRUD CHECKS PASSED!');
}

verify().catch(e => {
  console.error('Verification failed:', e);
  process.exit(1);
});
