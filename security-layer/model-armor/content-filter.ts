export interface FilterResult {
  allowed: boolean;
  reason?: string;
  category?: 'toxic' | 'pii' | 'malicious' | 'safe';
}

export class ContentFilter {
  private blocklist = new Set([
    'ignore previous instructions',
    'disregard system prompt',
    'jailbreak',
    'sudo mode',
  ]);

  filterInput(text: string): FilterResult {
    const lower = text.toLowerCase();

    // Check blocklist
    for (const blocked of this.blocklist) {
      if (lower.includes(blocked)) {
        return {
          allowed: false,
          reason: `Blocked pattern detected: ${blocked}`,
          category: 'malicious',
        };
      }
    }

    return { allowed: true, category: 'safe' };
  }
}
