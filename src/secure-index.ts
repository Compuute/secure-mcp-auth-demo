/**
 * Secure wrapper for Google's apigee-mcp with enterprise security layer
 */
import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RequestHandlerExtra } from "@modelcontextprotocol/sdk/shared/protocol.js";
import { McpApi, McpApiOptions } from "../google-baseline/apigee-mcp/src/api.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { generateOpenApiTools, OpenApiTool } from "../google-baseline/apigee-mcp/src/openapi_tools.js";
import { executeOpenApiTool } from "../google-baseline/apigee-mcp/src/mcp_api_executor.js";
import type { ExecuteOpenApiToolInput } from "../google-baseline/apigee-mcp/src/mcp_api_executor.js";

// *** SECURITY LAYER IMPORTS ***
import { secureToolExecution } from "../security-layer/audit-logging/index.js";
import { AgentIdentity } from "../security-layer/mtls/agent-identity.js";

class SecureApiProductMcpServer extends McpServer {
  private api: McpApi;
  private openApiTools: OpenApiTool[] = [];

  constructor(options: McpApiOptions = {}) {
    super({
      name: "secure-api-product-mcp",
      version: "1.0.0-security",
      description: "Enterprise-secured MCP server with ABAC, audit logging, and threat protection"
    });

    this.api = new McpApi({
      baseUrl: options.baseUrl || process.env.MCP_BASE_URL,
      clientId: options.clientId || process.env.MCP_CLIENT_ID,
      clientSecret: options.clientSecret || process.env.MCP_CLIENT_SECRET,
      cacheTTL: options.cacheTTL !== undefined
        ? options.cacheTTL
        : process.env.MCP_CACHE_TTL
          ? parseInt(process.env.MCP_CACHE_TTL, 10)
          : undefined
    });
  }

  async initialize() {
    console.log("🔒 Initializing SecureApiProductMcpServer with enterprise security...");
    try {
      const specData = await this.api.getAllProductSpecsContent();
      this.openApiTools = generateOpenApiTools(specData);
      this._registerSecureTools();
      console.log("✅ SecureApiProductMcpServer initialized with security layer.");
    } catch (error) {
      console.error("❌ Failed to initialize SecureApiProductMcpServer:", error);
      throw error;
    }
  }

  private _registerSecureTools() {
    if (this.openApiTools.length === 0) {
      console.warn("⚠️  No tools to register.");
      return;
    }

    console.log(`🔧 Registering ${this.openApiTools.length} secure tools...`);
    this.openApiTools.forEach(tool => {
      this.tool(
        tool.method,
        tool.description,
        tool.parameters.shape,
        async (params: any, _extra: RequestHandlerExtra<any, any>) => {
          console.log(`🔒 [SECURE] Executing tool: ${tool.name}`);

          // *** SECURITY LAYER: Extract agent identity ***
          const agent: AgentIdentity = {
            agentId: _extra?.meta?.agentId || 'unknown-agent',
            allowedTools: ['*'], // TODO: Load from ABAC policy store
            trustLevel: 'medium'
          };

          const getAuthHeaders = async (): Promise<Record<string, string>> => {
            const token = await this.api.getValidAccessToken();
            return { 'Authorization': `Bearer ${token}` };
          };

          const executionInput: ExecuteOpenApiToolInput = {
            method: tool.method,
            parameters: params,
            getAuthenticationHeaders: getAuthHeaders,
            executionDetails: tool.executionDetails
          };

          // *** SECURITY WRAPPER: ABAC + Validation + Audit + SIEM ***
          return await secureToolExecution(
            tool.name,
            agent,
            params,
            () => executeOpenApiTool(executionInput)
          );
        }
      );
    });
    console.log("✅ Secure tools registered successfully.");
  }
}

async function main() {
  const clientId = process.env.MCP_CLIENT_ID;
  const clientSecret = process.env.MCP_CLIENT_SECRET;
  const mcpMode = process.env.MCP_MODE?.toUpperCase() || 'STDIO';

  if (!clientId || !clientSecret) {
    console.error("❌ Error: MCP_CLIENT_ID and MCP_CLIENT_SECRET required.");
    process.exit(1);
  }

  const server = new SecureApiProductMcpServer();

  if (mcpMode === 'STDIO') {
    console.log("🔒 Running in STDIO mode with security layer...");
    try {
      await server.initialize();
    } catch (initError) {
      console.warn("⚠️  Server initialization failed:", initError);
    }
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("✅ Secure MCP Server running in STDIO mode.");

  } else if (mcpMode === 'SSE') {
    console.log("🔒 Running in SSE mode with security layer...");
    const base_path = process.env.BASE_PATH || "mcp-proxy";
    await server.initialize();

    const app = express();
    let transport: SSEServerTransport | null = null;

    app.get(`/${base_path}/sse`, (req, res) => {
      transport = new SSEServerTransport(`/${base_path}/messages`, res);
      server.connect(transport);
    });

    app.post(`/${base_path}/messages`, (req, res) => {
      if (transport) {
        transport.handlePostMessage(req, res);
      } else {
        res.status(400).send("SSE transport not initialized.");
      }
    });

    const port = process.env.PORT || 3000;
    app.listen(port, () => {
      console.log(`🔒 Secure MCP Server on port ${port}`);
      console.log(`📡 SSE: http://localhost:${port}/${base_path}/sse`);
    });
  } else {
    console.error(`❌ Invalid MCP_MODE: '${process.env.MCP_MODE}'`);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("💥 Server error:", error);
  process.exit(1);
});
