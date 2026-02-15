export function validateToolInput(toolName: string, params: unknown): void {
  const str = JSON.stringify(params);
  
  // Prompt injection patterns
  const patterns = [
    /ignore previous instructions/i,
    /system prompt/i,
    /jailbreak/i,
    /<script>/i,
    /\$\{.*\}/,
  ];

  for (const pattern of patterns) {
    if (pattern.test(str)) {
      throw new Error(`Security violation on tool ${toolName}: injection detected`);
    }
  }
}
