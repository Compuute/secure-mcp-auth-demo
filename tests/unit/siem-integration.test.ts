import { describe, it, expect, vi } from 'vitest';
import { sendToSiem } from '../../security-layer/audit-logging/siem-integration';

describe('SIEM Integration', () => {
  it('should send security events', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    await sendToSiem({
      toolName: 'test-tool',
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      status: 'success',
    });

    // Should log to console (SIEM backends disabled in test)
    expect(consoleSpy).toHaveBeenCalled();
  });

  it('should classify severity correctly', async () => {
    const consoleSpy = vi.spyOn(console, 'log');

    // Blocked = HIGH severity
    await sendToSiem({
      toolName: 'test-tool',
      agentId: 'test-agent',
      timestamp: new Date().toISOString(),
      status: 'blocked',
      reason: 'Policy violation',
    });

    const logOutput = consoleSpy.mock.calls[0][1];
    expect(logOutput).toContain('HIGH');
  });
});
