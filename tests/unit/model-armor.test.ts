import { describe, it, expect } from 'vitest';
import { ModelArmor } from '../../security-layer/model-armor';

describe('Model Armor', () => {
  const armor = new ModelArmor();

  it('should detect email PII', async () => {
    const result = await armor.scanInput('Contact me at test@example.com');
    expect(result.piiDetected).toHaveLength(1);
    expect(result.piiDetected[0].type).toBe('email');
  });

  it('should detect SSN PII', async () => {
    const result = await armor.scanInput('My SSN is 123-45-6789');
    expect(result.piiDetected).toHaveLength(1);
    expect(result.piiDetected[0].type).toBe('ssn');
  });

  it('should detect credit card PII', async () => {
    const result = await armor.scanInput('Card: 4532-1234-5678-9010');
    expect(result.piiDetected).toHaveLength(1);
    expect(result.piiDetected[0].type).toBe('credit_card');
  });

  it('should sanitize PII', async () => {
    const result = await armor.scanInput('Email: test@example.com, SSN: 123-45-6789');
    expect(result.sanitizedContent).toContain('[REDACTED_EMAIL]');
    expect(result.sanitizedContent).toContain('[REDACTED_SSN]');
    expect(result.sanitizedContent).not.toContain('test@example.com');
  });

  it('should detect policy violations', async () => {
    const result = await armor.scanInput('How to hack into a system');
    expect(result.safe).toBe(false);
    expect(result.violations.length).toBeGreaterThan(0);
  });

  it('should pass clean content', async () => {
    const result = await armor.scanInput('What is the weather today?');
    expect(result.safe).toBe(true);
    expect(result.piiDetected).toHaveLength(0);
  });
});
