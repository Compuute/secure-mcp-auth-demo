import { auditLog } from './middleware.js';
import { sendToSiem } from './siem-integration.js';
import { validateToolInput } from '../threat-protection/input-validator.js';
import { validateAgentAccess } from '../mtls/agent-identity.js';
export async function secureToolExecution(toolName, agent, params, executeFn) {
    // 1. ABAC - är agenten tillåten?
    validateAgentAccess(agent, toolName);
    // 2. Input validation - prompt injection?
    validateToolInput(toolName, params);
    // 3. Execute med audit logging
    return auditLog(toolName, agent.agentId, params, async () => {
        try {
            const result = await executeFn();
            await sendToSiem({
                toolName,
                agentId: agent.agentId,
                timestamp: new Date().toISOString(),
                status: 'success',
            });
            return result;
        }
        catch (error) {
            await sendToSiem({
                toolName,
                agentId: agent.agentId,
                timestamp: new Date().toISOString(),
                status: 'error',
                reason: error.message,
            });
            throw error;
        }
    });
}
