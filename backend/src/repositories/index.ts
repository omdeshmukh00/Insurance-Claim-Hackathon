import { randomUUID } from 'crypto';
import { isSupabaseConfigured, getSupabaseAdmin } from '../config/supabase.js';
import { inMemoryStore } from './inMemoryStore.js';
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
  AuditLog,
  UserPolicy,
} from '../types/database.js';

// ============================================================
// PROFILE REPOSITORY
// ============================================================
export const profileRepository = {
  async findById(id: string): Promise<Profile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as Profile;
    }
    return inMemoryStore.profiles.get(id) || null;
  },

  async findByEmail(email: string): Promise<Profile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single();
      if (error || !data) return null;
      return data as Profile;
    }
    for (const p of inMemoryStore.profiles.values()) {
      if (p.email.toLowerCase() === email.toLowerCase()) return p;
    }
    return null;
  },

  async upsert(profile: Profile): Promise<Profile> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('profiles')
        .upsert(profile)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Profile;
    }
    inMemoryStore.profiles.set(profile.id, profile);
    return profile;
  },

  async update(id: string, updates: Partial<Profile>): Promise<Profile | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as Profile;
    }
    const existing = inMemoryStore.profiles.get(id);
    if (!existing) return null;
    const updated: Profile = { ...existing, ...updates, updated_at: new Date().toISOString() };
    inMemoryStore.profiles.set(id, updated);
    return updated;
  },
};

// ============================================================
// CLAIM REPOSITORY
// ============================================================
export const claimRepository = {
  async create(claimInput: Omit<Claim, 'id' | 'created_at' | 'updated_at'>): Promise<Claim> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const claim: Claim = {
      ...claimInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claims')
        .insert(claim)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Claim;
    }

    inMemoryStore.claims.set(id, claim);
    return claim;
  },

  async findById(id: string): Promise<Claim | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claims')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as Claim;
    }
    return inMemoryStore.claims.get(id) || null;
  },

  async findByClaimantId(claimantId: string): Promise<Claim[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claims')
        .select('*')
        .eq('claimant_id', claimantId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Claim[];
    }
    return Array.from(inMemoryStore.claims.values())
      .filter((c) => c.claimant_id === claimantId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async findAll(): Promise<Claim[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claims')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as Claim[];
    }
    return Array.from(inMemoryStore.claims.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  },

  async update(id: string, updates: Partial<Claim>): Promise<Claim | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claims')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as Claim;
    }

    const existing = inMemoryStore.claims.get(id);
    if (!existing) return null;
    const updated: Claim = {
      ...existing,
      ...updates,
      updated_at: now,
    };
    inMemoryStore.claims.set(id, updated);
    return updated;
  },
};

// ============================================================
// DOCUMENT REPOSITORY
// ============================================================
export const documentRepository = {
  async create(docInput: Omit<ClaimDocument, 'id' | 'created_at' | 'updated_at'>): Promise<ClaimDocument> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const doc: ClaimDocument = {
      ...docInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_documents')
        .insert(doc)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClaimDocument;
    }

    inMemoryStore.claimDocuments.set(id, doc);
    return doc;
  },

  async findById(id: string): Promise<ClaimDocument | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_documents')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as ClaimDocument;
    }
    return inMemoryStore.claimDocuments.get(id) || null;
  },

  async findByClaimId(claimId: string): Promise<ClaimDocument[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_documents')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as ClaimDocument[];
    }
    return Array.from(inMemoryStore.claimDocuments.values())
      .filter((d) => d.claim_id === claimId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async update(id: string, updates: Partial<ClaimDocument>): Promise<ClaimDocument | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_documents')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as ClaimDocument;
    }

    const existing = inMemoryStore.claimDocuments.get(id);
    if (!existing) return null;
    const updated: ClaimDocument = { ...existing, ...updates, updated_at: now };
    inMemoryStore.claimDocuments.set(id, updated);
    return updated;
  },
};

// ============================================================
// EVIDENCE REPOSITORY
// ============================================================
export const evidenceRepository = {
  async create(evidenceInput: Omit<Evidence, 'id' | 'created_at'>): Promise<Evidence> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const item: Evidence = {
      ...evidenceInput,
      id,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('evidence')
        .insert(item)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Evidence;
    }

    inMemoryStore.evidence.set(id, item);
    return item;
  },

  async createBatch(evidenceList: Array<Omit<Evidence, 'id' | 'created_at'>>): Promise<Evidence[]> {
    const created: Evidence[] = [];
    for (const item of evidenceList) {
      created.push(await this.create(item));
    }
    return created;
  },

  async findByClaimId(claimId: string): Promise<Evidence[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('evidence')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as Evidence[];
    }
    return Array.from(inMemoryStore.evidence.values())
      .filter((e) => e.claim_id === claimId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async findByIds(ids: string[]): Promise<Evidence[]> {
    if (ids.length === 0) return [];
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('evidence')
        .select('*')
        .in('id', ids);
      if (error) throw new Error(error.message);
      return (data || []) as Evidence[];
    }
    return ids.map((id) => inMemoryStore.evidence.get(id)).filter(Boolean) as Evidence[];
  },
};

// ============================================================
// AGENT REPOSITORY
// ============================================================
export const agentRepository = {
  async createRun(runInput: Omit<AgentRun, 'id' | 'created_at'>): Promise<AgentRun> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const run: AgentRun = {
      ...runInput,
      id,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('agent_runs')
        .insert(run)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as AgentRun;
    }

    inMemoryStore.agentRuns.set(id, run);
    return run;
  },

  async updateRun(id: string, updates: Partial<AgentRun>): Promise<AgentRun | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('agent_runs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as AgentRun;
    }

    const existing = inMemoryStore.agentRuns.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    inMemoryStore.agentRuns.set(id, updated);
    return updated;
  },

  async getRunsByClaimId(claimId: string): Promise<AgentRun[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('agent_runs')
        .select('*')
        .eq('claim_id', claimId)
        .order('started_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as AgentRun[];
    }
    return Array.from(inMemoryStore.agentRuns.values())
      .filter((r) => r.claim_id === claimId)
      .sort((a, b) => a.started_at.localeCompare(b.started_at));
  },

  async createFinding(findingInput: Omit<AgentFinding, 'id' | 'created_at'>): Promise<AgentFinding> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const finding: AgentFinding = {
      ...findingInput,
      id,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('agent_findings')
        .insert(finding)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as AgentFinding;
    }

    inMemoryStore.agentFindings.set(id, finding);
    return finding;
  },

  async getFindingsByClaimId(claimId: string): Promise<AgentFinding[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('agent_findings')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as AgentFinding[];
    }
    return Array.from(inMemoryStore.agentFindings.values())
      .filter((f) => f.claim_id === claimId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },
};

// ============================================================
// POLICY REPOSITORY (RAG)
// ============================================================
export const policyRepository = {
  async findPolicyByNumber(policyNumber: string): Promise<PolicyDocument | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('policy_documents')
        .select('*')
        .eq('policy_number', policyNumber)
        .single();
      if (error || !data) return null;
      return data as PolicyDocument;
    }
    for (const p of inMemoryStore.policyDocuments.values()) {
      if (p.policy_number.toLowerCase() === policyNumber.toLowerCase()) return p;
    }
    return null;
  },

  async getPolicyChunks(policyDocumentId: string): Promise<PolicyChunk[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('policy_chunks')
        .select('*')
        .eq('policy_document_id', policyDocumentId)
        .order('chunk_index', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as PolicyChunk[];
    }
    return Array.from(inMemoryStore.policyChunks.values())
      .filter((c) => c.policy_document_id === policyDocumentId)
      .sort((a, b) => a.chunk_index - b.chunk_index);
  },

  async searchPolicyChunks(policyNumber: string, query: string): Promise<PolicyChunk[]> {
    const policy = await this.findPolicyByNumber(policyNumber);
    if (!policy) return [];

    const chunks = await this.getPolicyChunks(policy.id);
    if (!query || query.trim().length === 0) return chunks;

    const queryWords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
    // Score chunks by keyword matches
    const scored = chunks.map((chunk) => {
      const text = (chunk.section_title + ' ' + chunk.chunk_text).toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (text.includes(word)) score += 1;
      }
      return { chunk, score };
    });

    // Return scored or all chunks
    return scored
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((s) => s.chunk);
  },
};

// ============================================================
// MISSING INFORMATION REPOSITORY
// ============================================================
export const missingInfoRepository = {
  async create(infoInput: Omit<MissingInformation, 'id' | 'created_at' | 'updated_at'>): Promise<MissingInformation> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const info: MissingInformation = {
      ...infoInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('missing_information')
        .insert(info)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as MissingInformation;
    }

    inMemoryStore.missingInformation.set(id, info);
    return info;
  },

  async findByClaimId(claimId: string): Promise<MissingInformation[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('missing_information')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as MissingInformation[];
    }
    return Array.from(inMemoryStore.missingInformation.values())
      .filter((m) => m.claim_id === claimId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
  },

  async update(id: string, updates: Partial<MissingInformation>): Promise<MissingInformation | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('missing_information')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as MissingInformation;
    }

    const existing = inMemoryStore.missingInformation.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: now };
    inMemoryStore.missingInformation.set(id, updated);
    return updated;
  },
};

// ============================================================
// ASSESSMENT REPOSITORY
// ============================================================
export const assessmentRepository = {
  async create(assessmentInput: Omit<Assessment, 'id' | 'created_at' | 'updated_at'>): Promise<Assessment> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const assessment: Assessment = {
      ...assessmentInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('assessments')
        .insert(assessment)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Assessment;
    }

    inMemoryStore.assessments.set(id, assessment);
    return assessment;
  },

  async findByClaimId(claimId: string): Promise<Assessment | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('assessments')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return null;
      return data as Assessment;
    }
    const matching = Array.from(inMemoryStore.assessments.values())
      .filter((a) => a.claim_id === claimId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return matching[0] || null;
  },
};

// ============================================================
// REVIEW REPOSITORY
// ============================================================
export const reviewRepository = {
  async create(decisionInput: Omit<ReviewDecision, 'id' | 'created_at'>): Promise<ReviewDecision> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const decision: ReviewDecision = {
      ...decisionInput,
      id,
      created_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('review_decisions')
        .insert(decision)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ReviewDecision;
    }

    inMemoryStore.reviewDecisions.set(id, decision);
    return decision;
  },

  async findByClaimId(claimId: string): Promise<ReviewDecision[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('review_decisions')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as ReviewDecision[];
    }
    return Array.from(inMemoryStore.reviewDecisions.values())
      .filter((r) => r.claim_id === claimId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },
};

// ============================================================
// SETTLEMENT REPOSITORY
// ============================================================
export const settlementRepository = {
  async create(settlementInput: Omit<Settlement, 'id' | 'created_at' | 'updated_at'>): Promise<Settlement> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const settlement: Settlement = {
      ...settlementInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('settlements')
        .insert(settlement)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as Settlement;
    }

    inMemoryStore.settlements.set(id, settlement);
    return settlement;
  },

  async findByClaimId(claimId: string): Promise<Settlement | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('settlements')
        .select('*')
        .eq('claim_id', claimId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return null;
      return data as Settlement;
    }
    const matching = Array.from(inMemoryStore.settlements.values())
      .filter((s) => s.claim_id === claimId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
    return matching[0] || null;
  },

  async update(id: string, updates: Partial<Settlement>): Promise<Settlement | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('settlements')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as Settlement;
    }

    const existing = inMemoryStore.settlements.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updated_at: now };
    inMemoryStore.settlements.set(id, updated);
    return updated;
  },
};

// ============================================================
// CLAIM EVENTS REPOSITORY
// ============================================================
export const eventRepository = {
  async create(eventInput: Omit<ClaimEvent, 'id' | 'timestamp'>): Promise<ClaimEvent> {
    const timestamp = new Date().toISOString();
    const id = randomUUID();
    const event: ClaimEvent = {
      ...eventInput,
      id,
      timestamp,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_events')
        .insert(event)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as ClaimEvent;
    }

    inMemoryStore.claimEvents.set(id, event);
    return event;
  },

  async findByClaimId(claimId: string): Promise<ClaimEvent[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('claim_events')
        .select('*')
        .eq('claim_id', claimId)
        .order('timestamp', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as ClaimEvent[];
    }
    return Array.from(inMemoryStore.claimEvents.values())
      .filter((e) => e.claim_id === claimId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },
};

// ============================================================
// AUDIT LOG REPOSITORY
// ============================================================
export const auditRepository = {
  async create(logInput: Omit<AuditLog, 'id' | 'timestamp'>): Promise<AuditLog> {
    const timestamp = new Date().toISOString();
    const id = randomUUID();
    const log: AuditLog = {
      ...logInput,
      id,
      timestamp,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('audit_logs')
        .insert(log)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as AuditLog;
    }

    inMemoryStore.auditLogs.set(id, log);
    return log;
  },

  async findByEntity(entityType: string, entityId: string): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('audit_logs')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .order('timestamp', { ascending: true });
      if (error) throw new Error(error.message);
      return (data || []) as AuditLog[];
    }
    return Array.from(inMemoryStore.auditLogs.values())
      .filter((l) => l.entity_type === entityType && l.entity_id === entityId)
      .sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  },

  async findAll(): Promise<AuditLog[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('audit_logs')
        .select('*')
        .order('timestamp', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as AuditLog[];
    }
    return Array.from(inMemoryStore.auditLogs.values()).sort((a, b) =>
      b.timestamp.localeCompare(a.timestamp)
    );
  },
};

// ============================================================
// USER POLICY REPOSITORY
// ============================================================
export const userPolicyRepository = {
  async create(policyInput: Omit<UserPolicy, 'id' | 'created_at' | 'updated_at'>): Promise<UserPolicy> {
    const now = new Date().toISOString();
    const id = randomUUID();
    const policy: UserPolicy = {
      ...policyInput,
      id,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .insert(policy)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data as UserPolicy;
    }

    inMemoryStore.userPolicies.set(id, policy);
    return policy;
  },

  async findById(id: string): Promise<UserPolicy | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .select('*')
        .eq('id', id)
        .single();
      if (error || !data) return null;
      return data as UserPolicy;
    }
    return inMemoryStore.userPolicies.get(id) || null;
  },

  async findByUserId(userId: string): Promise<UserPolicy[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as UserPolicy[];
    }
    return Array.from(inMemoryStore.userPolicies.values())
      .filter((p) => p.user_id === userId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async findByPolicyNumber(policyNumber: string): Promise<UserPolicy | null> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .select('*')
        .eq('policy_number', policyNumber)
        .single();
      if (error || !data) return null;
      return data as UserPolicy;
    }
    for (const p of inMemoryStore.userPolicies.values()) {
      if (p.policy_number.toLowerCase() === policyNumber.toLowerCase()) return p;
    }
    return null;
  },

  async findAll(): Promise<UserPolicy[]> {
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw new Error(error.message);
      return (data || []) as UserPolicy[];
    }
    return Array.from(inMemoryStore.userPolicies.values()).sort((a, b) =>
      b.created_at.localeCompare(a.created_at)
    );
  },

  async update(id: string, updates: Partial<UserPolicy>): Promise<UserPolicy | null> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const { data, error } = await getSupabaseAdmin()
        .from('user_policies')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error || !data) return null;
      return data as UserPolicy;
    }

    const existing = inMemoryStore.userPolicies.get(id);
    if (!existing) return null;
    const updated: UserPolicy = { ...existing, ...updates, updated_at: now };
    inMemoryStore.userPolicies.set(id, updated);
    return updated;
  },
};

