# MCP Security Threat Model

## Threat Categories

### 1. Authentication Gaps
- [ ] Static API keys
- [ ] No workload identity
- [x] Missing mTLS → agent-identity.ts

### 2. Authorization Gaps
- [x] Over-broad tool permissions → agent-identity.ts (ABAC)

### 3. Audit Gaps
- [x] No audit schema → middleware.ts (OTel)
- [x] No SIEM → siem-integration.ts

### 4. Prompt Injection
- [x] No input validation → input-validator.ts

### 5. Data Governance
- [ ] No PII detection → model-armor/ (TODO)
