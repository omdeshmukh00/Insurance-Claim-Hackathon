-- Migration: 003_seed_policies.sql
-- Description: Seed sample policy documents and clauses for RAG Policy Agent retrieval

INSERT INTO policy_documents (id, policy_number, title, policy_type, effective_from, effective_to, raw_content)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'POL-AUTO-2026-001',
    'Comprehensive Comprehensive Auto Motorist Policy',
    'AUTO',
    '2026-01-01',
    '2026-12-31',
    'Section 1: Collision Coverage. Covers direct physical loss or collision damage to the covered vehicle up to $50,000 subject to a $500 deductible. Section 2: Comprehensive Coverage. Covers fire, theft, vandalism, and weather damage. Section 3: Exclusions. Excludes intentional acts, racing, wear and tear, and unverified hit-and-run incidents without police report filed within 48 hours.'
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'POL-PROP-2026-002',
    'Homeowners & Commercial Property Protection Policy',
    'PROPERTY',
    '2026-01-01',
    '2026-12-31',
    'Section A: Dwelling Coverage up to $500,000. Section B: Personal Property up to $100,000. Section C: Exclusions. Flood and earthquake damage require specialized endorsements. Water damage from sudden pipe burst is covered; gradual seepage over 14 days is excluded.'
  )
ON CONFLICT (id) DO NOTHING;

INSERT INTO policy_chunks (id, policy_document_id, section_title, page_number, chunk_text, chunk_index)
VALUES 
  (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    'Section 1: Collision Coverage',
    1,
    'Collision Coverage: The insurer will pay for direct, sudden, and accidental damage to your insured motor vehicle caused by upset or collision with another vehicle or object. Maximum limit of liability is the vehicle actual cash value or policy stated limit of $50,000, subject to standard $500 deductible per occurrence.',
    0
  ),
  (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '11111111-1111-1111-1111-111111111111',
    'Section 3: Exclusions and Filing Timelines',
    2,
    'Exclusions: No coverage applies for intentional acts, driver racing or illegal speed contests, mechanical breakdown, normal wear and tear, or claims where an incident police report is not filed within 48 hours of occurrence if another vehicle is involved.',
    1
  ),
  (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '22222222-2222-2222-2222-222222222222',
    'Section A: Dwelling and Structural Damage',
    1,
    'Dwelling Coverage: Covers accidental physical damage to the primary residential dwelling, including sudden roof damage, broken windows, and accidental structural impacts caused by storm, hail, or vehicular impact up to $500,000 with a $1,000 deductible.',
    0
  ),
  (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '22222222-2222-2222-2222-222222222222',
    'Section C: Water Damage vs Flood Exclusion',
    2,
    'Water Damage Conditions: Sudden and accidental discharge of water or steam from plumbing, heating, or air conditioning systems is covered. Excluded: Flooding, surface water, storm surge, or water damage continuing over a period of 14 days or more (gradual seepage).',
    1
  )
ON CONFLICT (id) DO NOTHING;
