import { describe, it, expect, beforeEach } from 'vitest';
import { AbacPolicyEngine } from '../../security-layer/mtls/abac-policy';

describe('ABAC Policy Engine', () => {
  let engine: AbacPolicyEngine;

  beforeEach(() => {
    engine = new AbacPolicyEngine();
  });

  it('should allow admin full access', () => {
    const result = engine.evaluateAccess('admin-agent', 'any-tool', 'high');
    expect(result.allowed).toBe(true);
  });

  it('should allow readonly agent to list tools', () => {
    const result = engine.evaluateAccess('readonly-agent', 'listTools', 'medium');
    expect(result.allowed).toBe(true);
  });

  it('should deny readonly agent write access', () => {
    const result = engine.evaluateAccess('readonly-agent', 'deleteData', 'medium');
    expect(result.allowed).toBe(false);
  });

  it('should enforce trust level requirements', () => {
    const result = engine.evaluateAccess('admin-agent', 'sensitive-tool', 'low');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('conditions not met');
  });

  it('should enforce rate limits', async () => {
    // First 50 requests should pass
    for (let i = 0; i < 50; i++) {
      const result = engine.evaluateAccess('test-agent', 'getTool', 'medium');
      expect(result.allowed).toBe(true);
    }

    // 51st request should fail
    const result = engine.evaluateAccess('test-agent', 'getTool', 'medium');
    expect(result.allowed).toBe(false);
    expect(result.reason).toBe('Rate limit exceeded');
  });
});
