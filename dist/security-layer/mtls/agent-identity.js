export function validateAgentAccess(agent, toolName) {
    if (!agent.allowedTools.includes(toolName)) {
        throw new Error(`Agent ${agent.agentId} not authorized for tool ${toolName}`);
    }
}
