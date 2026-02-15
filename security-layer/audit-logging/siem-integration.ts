export async function sendToSiem(event: {
  toolName: string;
  agentId: string;
  timestamp: string;
  status: 'success' | 'blocked' | 'error';
  reason?: string;
}): Promise<void> {
  // Google SecOps / Splunk / Elastic compatible
  const payload = {
    ...event,
    source: 'mcp-security-layer',
    severity: event.status === 'blocked' ? 'HIGH' : 'INFO',
  };
  console.log('[SIEM]', JSON.stringify(payload));
  // TODO: HTTP POST to SIEM endpoint
}
