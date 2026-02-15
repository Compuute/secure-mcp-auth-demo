# Security Layer Architecture

## Our Security Layer → Google Baseline Reference

### mtls/
Based on: google-baseline/mtls-northbound + mtls-southbound
Adds: Agent-to-agent mTLS, workload identity

### audit-logging/
Based on: google-baseline/cloud-logging
Adds: OTel traces, MCP-specific audit schema, SIEM integration

### model-armor/
Based on: google-baseline/llm-security + llm-security-v2
Adds: Model Armor integration, prompt injection defense

### threat-protection/
Based on: google-baseline/threat-protection + data-deidentification
Adds: OWASP LLM Top 10 mapping, PII detection

### multi-cloud/
New: AWS/Azure portable patterns
Based on: Our ZTNA background

## Core Demo
google-baseline/apigee-mcp/ + all security layers above
= Production-ready Secure MCP Gateway
