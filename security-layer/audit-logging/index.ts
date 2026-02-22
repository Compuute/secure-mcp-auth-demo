import { auditLog } from './middleware.js';
import { sendToSiem } from './siem-integration.js';
import { validateToolInput } from '../threat-protection/input-validator.js';
import { validateAgentAccess, AgentIdentity } from '../mtls/agent-identity.js';
import { ModelArmor } from '../model-armor/index.js';

const armor = new ModelArmor();

export async function secureToolExecution(
  toolName: string,
  agent: AgentIdentity,
  params: unknown,
  executeFn: () => Promise<unknown>
): Promise<unknown> {

  // 1. ABAC - är agenten tillåten?
  validateAgentAccess(agent, toolName);

  // 2. Input validation - prompt injection?
  validateToolInput(toolName, params);

  // 3. Model Armor - PII & content filtering
  const paramStr = JSON.stringify(params);
  const armorResult = ait armor.scanInput(paramStr);
  
  if (!armorResult.safe) {
    await sendToSiem({
      toolName,
      agentId: agent.agentId,
      timestamp: new Date().toISOString(),
      status: 'blocked',
      reason: `Model Armor: ${armorResult.violations.join(', ')}`,
    });
    throw new Error(`Content policy violation: ${armorResult.violations[0]}`);
  }

  if (armorResult.piiDetected.length > 0) {
    console.warn(`[Model Armor] PII detected in input: ${armorResult.piiDetected.length} entities`);
  }

  // 4. Execute med audit logging
  return auditLog(toolName, agent.agentId, params, async () => {
    try {
      const result = await executeFn();
      
      // 5. Scan output for PII
      const outputStr = JSON.stringify(result);
      const outputArmor = await armor.scanOutput(outputStr);
      
      if (outputArmor.piiDetected.length > 0) {
        console.warn(`[Model Armor] PII detected in output: ${outputArmor.piiDetected.length} entities`);
      }

      await sendToSiem({
        toolName,
        agentId: agent.agentId,
        timestamp: new Date().toISOString(),
        status: 'success',
      });
      return result;
    } catch (error) {
      await sendToSiem({
        toolName,
        agentId: agent.agentId,
        timestamp: new Date().toISOString(),
        status: 'error',
        reason: (error as Error).message,
      });
      throw error;
    }
  });
}
