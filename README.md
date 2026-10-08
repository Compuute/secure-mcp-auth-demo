# Secure MCP Auth Demo

A reference implementation of a security layer in front of an MCP (Model Context Protocol) server. It wraps Google's Apigee MCP sample and shows how agent identity, authorization, input filtering and audit logging can be layered on top.

> **Status: demo / reference implementation.** It is built to illustrate patterns and to support threat-modelling discussions. It is not production-hardened and has not been independently audited.

## What is implemented

| Control | Implementation | Status |
|---|---|---|
| **ABAC authorization** | Policy engine per agent and tool, with trust levels and per-agent rate limits (`security-layer/mtls/abac-policy.ts`) | Implemented, unit-tested |
| **mTLS agent identity** | Node TLS server with `requestCert` and `rejectUnauthorized`, plus a script for a local test CA (`security-layer/mtls/`) | Implemented, local test certificates only |
| **Prompt-injection filter** | Pattern-based input validation (`security-layer/threat-protection/input-validator.ts`) | Implemented, basic. Pattern filters are easy to bypass; treat as one layer, not a defence on its own |
| **PII detection** | Local regex detection of e-mail, card numbers and US-style phone and SSN formats (`security-layer/model-armor/`) | Implemented, basic. Google Model Armor is the intended production backend but is not called in this demo |
| **Audit logging** | Structured events with OpenTelemetry (`security-layer/audit-logging/`) | Implemented |
| **SIEM export** | Connector interfaces for Chronicle, Splunk HEC and Elastic (`siem-connectors.ts`) | Interfaces and configuration only; delivery is stubbed |
| **Workload Identity** | Discussed in the threat model | Not implemented |

## Architecture

```
MCP client / agent
      │  mTLS
      ▼
Secure wrapper (src/secure-index.ts)
      │
      ├─ ABAC policy engine
      ├─ Input validator (prompt-injection patterns)
      ├─ PII detector
      └─ Audit logging (OpenTelemetry → SIEM connectors)
      │
      ▼
Google Apigee MCP sample (git submodule: google-baseline)
```

## Quick start

```bash
git clone --recurse-submodules https://github.com/Compuute/secure-mcp-auth-demo
cd secure-mcp-auth-demo
npm install

# Local test CA and certificates (never use these outside a lab)
cd security-layer/mtls && ./generate-certs.sh && cd -

cp .env.example .env   # fill in the MCP base URL and client credentials
npm run dev
```

## Tests

```bash
npm run test:run
```

Current result: **18 of 18 tests pass** (unit tests for ABAC, input validation and PII detection, plus an end-to-end security flow). The tests run locally and do not need any cloud services.

## ABAC policies

Policies live in `security-layer/mtls/abac-policy.ts` (defaults) and can be loaded from JSON (see `policies.example.json`). Example of a narrowly scoped policy:

```json
{
  "id": "policy-readonly",
  "agents": ["reporting-agent"],
  "tools": ["list_products", "get_product"],
  "conditions": {
    "trustLevel": ["medium", "high"],
    "rateLimit": { "requests": 60, "windowMs": 60000 }
  }
}
```

Prefer explicit tool lists. Wildcard (`"*"`) grants are meant for local testing only.

## Documentation

- [Threat model](docs/threat-model.md)
- [Security gaps in the baseline](docs/security-gaps.md)
- [Architecture decisions](docs/architecture.md)

## Known limitations

- Pattern-based prompt-injection and PII detection have false negatives. Production use needs a dedicated classifier or managed service.
- SIEM delivery is stubbed; events are logged locally.
- No load or performance testing has been done.
- The upstream sample is pinned as a submodule; update it deliberately and re-run the tests.

## License

Apache 2.0, matching the Google baseline. Add a `LICENSE` file before reuse.

## Links

- [Google Apigee MCP sample](https://github.com/GoogleCloudPlatform/apigee-samples/tree/main/apigee-mcp)
- [Model Context Protocol](https://modelcontextprotocol.io)

Built with TypeScript, Express, OpenTelemetry and Vitest.
