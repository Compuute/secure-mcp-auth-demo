export interface AgentIdentity {
  agentId: string;
  allowedTools: string[];
  trustLevel: 'high' | 'medium' | 'low';
}

export function validateAgentAccess(
  agent: AgentIdentity,
  toolName: string
): void {
  if (!agent.allowedTools.includes(toolName)) {
    throw new Error(`Agent ${agent.agentId} not authorized for tool ${toolName}`);
  }
}
