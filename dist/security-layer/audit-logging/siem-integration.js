export async function sendToSiem(event) {
    // Google SecOps / Splunk / Elastic compatible
    const payload = {
        ...event,
        source: 'mcp-security-layer',
        severity: event.status === 'blocked' ? 'HIGH' : 'INFO',
    };
    console.log('[SIEM]', JSON.stringify(payload));
    // TODO: HTTP POST to SIEM endpoint
}
