import { trace, SpanStatusCode } from '@opentelemetry/api';

const tracer = trace.getTracer('mcp-security-layer');

export async function auditLog(
  toolName: string,
  agentId: string,
  params: unknown,
  executeFn: () => Promise<unknown>
): Promise<unknown> {
  return tracer.startActiveSpan(`mcp.tool.${toolName}`, async (span) => {
    try {
      // Audit attributes
      span.setAttributes({
        'mcp.tool.name': toolName,
        'mcp.agent.id': agentId,
        'mcp.timestamp': new Date().toISOString(),
        'mcp.params.hash': hashParams(params),
      });

      const result = await executeFn();
      
      span.setStatus({ code: SpanStatusCode.OK });
      return result;

    } catch (error) {
      span.setStatus({ code: SpanStatusCode.ERROR });
      span.recordException(error as Error);
      throw error;
    } finally {
      span.end();
    }
  });
}

function hashParams(params: unknown): string {
  return Buffer.from(JSON.stringify(params)).toString('base64').slice(0, 16);
}
