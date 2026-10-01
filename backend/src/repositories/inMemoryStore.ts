import {
  Profile,
  Claim,
  ClaimDocument,
  PolicyDocument,
  PolicyChunk,
  AgentRun,
  Evidence,
  AgentFinding,
  MissingInformation,
  Assessment,
  ReviewDecision,
  Settlement,
  ClaimEvent,
  EmailLog,
  AuditLog,
} from '../types/database.js';

export class InMemoryStore {
  public profiles: Map<string, Profile> = new Map();
  public claims: Map<string, Claim> = new Map();
  public claimDocuments: Map<string, ClaimDocument> = new Map();
  public policyDocuments: Map<string, PolicyDocument> = new Map();
  public policyChunks: Map<string, PolicyChunk> = new Map();
  public agentRuns: Map<string, AgentRun> = new Map();
  public evidence: Map<string, Evidence> = new Map();
  public agentFindings: Map<string, AgentFinding> = new Map();
  public missingInformation: Map<string, MissingInformation> = new Map();
  public assessments: Map<string, Assessment> = new Map();
  public reviewDecisions: Map<string, ReviewDecision> = new Map();
  public settlements: Map<string, Settlement> = new Map();
  public claimEvents: Map<string, ClaimEvent> = new Map();
  public emailLogs: Map<string, EmailLog> = new Map();
  public auditLogs: Map<string, AuditLog> = new Map();

  constructor() {
    this.seedDefaultData();
  }

  public clear(): void {
    this.profiles.clear();
    this.claims.clear();
    this.claimDocuments.clear();
    this.policyDocuments.clear();
    this.policyChunks.clear();
    this.agentRuns.clear();
    this.evidence.clear();
    this.agentFindings.clear();
    this.missingInformation.clear();
    this.assessments.clear();
    this.reviewDecisions.clear();
    this.settlements.clear();
    this.claimEvents.clear();
    this.emailLogs.clear();
    this.auditLogs.clear();
    this.seedDefaultData();
  }

  private seedDefaultData(): void {
    // Seed default profiles for testing: claimant, officer, investigator, admin
    const defaultProfiles: Profile[] = [
      {
        id: '11111111-0000-0000-0000-000000000001',
        email: 'claimant@example.com',
        full_name: 'Alice Claimant',
        role: 'CLAIMANT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '11111111-0000-0000-0000-000000000002',
        email: 'other_claimant@example.com',
        full_name: 'Bob Claimant',
        role: 'CLAIMANT',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '22222222-0000-0000-0000-000000000002',
        email: 'officer@example.com',
        full_name: 'Charlie Officer',
        role: 'CLAIMS_OFFICER',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '33333333-0000-0000-0000-000000000003',
        email: 'investigator@example.com',
        full_name: 'Dana Investigator',
        role: 'INVESTIGATOR',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: '44444444-0000-0000-0000-000000000004',
        email: 'admin@example.com',
        full_name: 'Evan Admin',
        role: 'ADMIN',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ];

    for (const p of defaultProfiles) {
      this.profiles.set(p.id, p);
    }

    // Seed default policies
    const autoPolicy: PolicyDocument = {
      id: '11111111-1111-1111-1111-111111111111',
      policy_number: 'POL-AUTO-2026-001',
      title: 'Comprehensive Auto Motorist Policy',
      policy_type: 'AUTO',
      effective_from: '2026-01-01',
      effective_to: '2026-12-31',
      raw_content: 'Collision coverage up to $50,000 with $500 deductible. Police report required within 48h.',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.policyDocuments.set(autoPolicy.id, autoPolicy);

    const chunk1: PolicyChunk = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      policy_document_id: autoPolicy.id,
      section_title: 'Section 1: Collision Coverage',
      page_number: 1,
      chunk_text: 'Collision Coverage: Direct accidental damage up to $50,000 maximum liability, subject to $500 deductible per incident. Excludes unverified hit-and-run without police report within 48 hours.',
      chunk_index: 0,
      created_at: new Date().toISOString(),
    };
    const chunk2: PolicyChunk = {
      id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
      policy_document_id: autoPolicy.id,
      section_title: 'Section 2: Deductibles and Limits',
      page_number: 2,
      chunk_text: 'Deductible amounts: Standard deductible is $500. Comprehensive deductible is $250. Incurred loss must exceed deductible before settlement disbursement.',
      chunk_index: 1,
      created_at: new Date().toISOString(),
    };
    this.policyChunks.set(chunk1.id, chunk1);
    this.policyChunks.set(chunk2.id, chunk2);
  }
}

export const inMemoryStore = new InMemoryStore();
