import { AbacPolicyEngine } from './abac-policy.js';

export interface AgentIdentity {
  agentId: string;
  allowedTools: string[];
  trustLevel: 'high' | 'medium' | 'low';
}

const policyEngine = new AbacPolicyEngine();

export function validateAgentAccess(
  agent: AgentIdentity,
  toolName: string
): void {
  // Use ABAC policy engine
  const result = policyEngine.evaluateAccess(
    agent.agentId,
    toolName,
    agent.trustLevel
  );

  if (!result.allowed) {
    throw new Error(
      `Access denied for agent ${agent.agentId} to tool ${toolName}: ${result.reason}`
    );
  }

  console.log(
    `[ABAC] Access granted: ${agent.agentId} → ${toolName} (policy: ${result.policy?.name})`
  );
}

export { AbacPolicyEngine 
