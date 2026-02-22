/**
 * Attribute-Based Access Control (ABAC) Policy Engine
 */

export interface Policy {
  id: string;
  name: string;
  agents: string[];  // agent IDs or '*' for all
  tools: string[];   // tool names or '*' for all
  conditions?: {
    trustLevel?: ('high' | 'medium' | 'low')[];
    timeWindow?: { start: string; end: string };
    rateLimit?: { requests: number; windowMs: number };
  };
}

export class AbacPolicyEngine {
  private policies: Policy[] = [];
  private rateLimitCache = new Map<string, number[]>();

  constructor() {
    this.loadDefaultPolicies();
  }

  private loadDefaultPolicies() {
    // Default policies
    this.policies = [
      {
        id: 'policy-admin-full',
        name: 'Admin Full Access',
        agents: ['admin-agent', 'operator-agent'],
        tools: ['*'],
        conditions: {
          trustLevel: ['high'],
        },
      },
      {
        id: 'policy-readonly',
        name: 'Read-Only Access',
        agents: ['readonly-agent'],
        tools: ['get*', 'list*', 'describe*'],
        conditions: {
          trustLevel: ['medium', 'high'],
          rateLimit: { requests: 100, windowMs: 60000 },
        },
      },
      {
        id: 'policy-default',
        name: 'Default Agent Access',
        agents: ['*'],
        tools: ['get*', 'list*'],
        conditions: {
          trustLevel: ['medium', 'high'],
          rateLimit: { requests: 50, windowMs: 60000 },
        },
      },
    ];

    console.log(`[ABAC] Loaded ${this.policies.length} policies`);
  }

  loadPoliciesFromFile(path: string) {
    // TODO: Load from JSON/YAML file
    console.log(`[ABAC] Load from file: ${path}`);
  }

  evaluateAccess(
    agentId: string,
    toolName: string,
    trustLevel: 'high' | 'medium' | 'low'
  ): { allowed: boolean; reason?: string; policy?: Policy } {
    
    // Find matching policies (most specific first)
    const matchingPolicies = this.policies.filter(p => 
      this.matchesAgent(p, agentId) && this.matchesTool(p, toolName)
    );

    if (matchingPolicies.length === 0) {
      return { 
        allowed: false, 
        reason: 'No matching policy found' 
      };
    }

    // Evaluate each policy
    for (const policy of matchingPolicies) {
      // Check trust level
      if (policy.conditions?.trustLevel) {
        if (!policy.conditions.trustLevel.includes(trustLevel)) {
          continue; // Try next policy
        }
      }

      // Check rate limit
      if (policy.conditions?.rateLimit) {
        if (!this.checkRateLimit(agentId, policy.conditions.rateLimit)) {
          return {
            allowed: false,
            reason: 'Rate limit exceeded',
            policy,
          };
        }
      }

      // Policy matched and all conditions passed
      this.recordRequest(agentId);
      return { allowed: true, policy };
    }

    return { 
      allowed: false, 
      reason: 'Policy conditions not met' 
    };
  }

  private matchesAgent(policy: Policy, agentId: string): boolean {
    return policy.agents.includes('*') || policy.agents.includes(agentId);
  }

  private matchesTool(policy: Policy, toolName: string): boolean {
    return policy.tools.some(pattern => {
      if (pattern === '*') return true;
      if (pattern.endsWith('*')) {
        return toolName.startsWith(pattern.slice(0, -1));
      }
      return pattern === toolName;
    });
  }

  private checkRateLimit(
    agentId: string, 
    limit: { requests: number; windowMs: number }
  ): boolean {
    const now = Date.now();
    const key = agentId;
    const timestamps = this.rateLimitCache.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      t => now - t < limit.windowMs
    );
    
    if (validTimestamps.length >= limit.requests) {
      return false; // Rate limit exceeded
    }

    return true;
  }

  private recordRequest(agentId: string) {
    const now = Date.now();
    const timestamps = this.rateLimitCache.get(agentId) || [];
    timestamps.push(now);
    this.rateLimitCache.set(agentId, timestamps);
  }

  getPolicies(): Policy[] {
    return this.policies;
  }
}
