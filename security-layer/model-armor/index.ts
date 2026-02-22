/**
 * Model Armor integration for content filtering and PII detection
 * Mock implementation - replace with real Model Armor API in production
 */

export interface ArmorResult {
  safe: boolean;
  violations: string[];
  piiDetected: PiiEntity[];
  sanitizedContent?: string;
}

export interface PiiEntity {
  type: 'email' | 'ssn' | 'credit_card' | 'phone' | 'address';
  value: string;
  start: number;
  end: number;
}

export class ModelArmor {
  private patterns = {
    email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
    credit_card: /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
    phone: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  };

  async scanInput(content: string): Promise<ArmorResult> {
    const violations: string[] = [];
    const piiDetected: PiiEntity[] = [];

    // PII detection
    Object.entries(this.patterns).forEach(([type, pattern]) => {
      const matches = content.matchAll(pattern);
      for (const match of matches) {
        piiDetected.push({
          type: type as PiiEntity['type'],
          value: match[0],
          start: match.index!,
          end: match.index! + match[0].length,
        });
      }
    });

    // Content policy violations
    const toxicPatterns = [
      /\b(hack|exploit|breach|steal)\b/i,
      /\b(confidential|secret|classified)\s+\w+/i,
    ];

    for (const pattern of toxicPatterns) {
      if (pattern.test(content)) {
        violations.push(`Policy violation: ${pattern.source}`);
      }
    }

    return {
      safe: violations.length === 0,
      violations,
      piiDetected,
      sanitizedContent: this.sanitize(content, piiDetected),
    };
  }

  async scanOutput(content: string): Promise<ArmorResult> {
    return this.scanInput(content); // Same logic for output
  }

  private sanitize(content: string, entities: PiiEntity[]): string {
    let sanitized = content;
    // Replace from end to start to preserve indices
    entities
      .sort((a, b) => b.start - a.start)
      .forEach((entity) => {
        const replacement = `[REDACTED_${entity.type.toUpperCase()}]`;
        sanitized =
          sanitized.slice(0, entity.start) +
          replacement +
          sanitized.slice(entity.end);
      });
    return sanitized;
  }
}
