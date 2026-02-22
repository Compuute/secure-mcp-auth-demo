import { SiemManager, SiemEvent } from './siem-connectors.js';

const siemManager = new SiemManager();

export async function sendToSiem(event: {
  toolName: string;
  agentId: string;
  timestamp: string;
  status: 'success' | 'blocked' | 'error';
  reason?: string;
}): Promise<void> {
  const severity = event.status === 'blocked' ? 'HIGH' : 
                   event.status === 'error' ? 'MEDIUM' : 'LOW';

  const siemEvent: SiemEvent = {
    timestamp: event.timestamp,
    source: 'mcp-security-layer',
    severity,
    category: 'mcp-tool-execution',
    agentId: event.agentId,
    toolName: event.toolName,
    status: event.status,
    reason: event.reason,
    metadata: {
      version: '1.0.0-security',
    },
  };

  await siemManager.send(siemEvent);
}
