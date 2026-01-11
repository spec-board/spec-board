#!/usr/bin/env node
/**
 * spec-board-mcp - MCP server for syncing spec-kit projects with SpecBoard cloud
 *
 * Tools:
 * - get_spec: Download newest specs from cloud to local
 * - set_spec: Upload local specs to cloud
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  type Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { pullSpec } from "./tools/pull-spec.js";
import { pushSpec } from "./tools/push-spec.js";

// Tool definitions
const tools: Tool[] = [
  {
    name: "pull_spec",
    description: "Download the newest specs from SpecBoard cloud to local project. Pulls all spec files (spec.md, plan.md, tasks.md) for all features or a specific feature.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Local path to the spec-kit project root (containing specs/ folder)",
        },
        cloudProjectId: {
          type: "string",
          description: "Cloud project ID or slug to pull from",
        },
        featureId: {
          type: "string",
          description: "Optional: specific feature ID to pull. If omitted, pulls all features.",
        },
      },
      required: ["projectPath", "cloudProjectId"],
    },
  },
  {
    name: "push_spec",
    description: "Upload local specs to SpecBoard cloud. Pushes all spec files (spec.md, plan.md, tasks.md) for all features or a specific feature.",
    inputSchema: {
      type: "object",
      properties: {
        projectPath: {
          type: "string",
          description: "Local path to the spec-kit project root (containing specs/ folder)",
        },
        cloudProjectId: {
          type: "string",
          description: "Cloud project ID or slug to push to",
        },
        featureId: {
          type: "string",
          description: "Optional: specific feature ID to push. If omitted, pushes all features.",
        },
      },
      required: ["projectPath", "cloudProjectId"],
    },
  },
];

// Create server instance
const server = new Server(
  {
    name: "spec-board-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Handle list tools request
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "pull_spec": {
        const result = await pullSpec(
          args?.projectPath as string,
          args?.cloudProjectId as string,
          args?.featureId as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      case "push_spec": {
        const result = await pushSpec(
          args?.projectPath as string,
          args?.cloudProjectId as string,
          args?.featureId as string | undefined
        );
        return {
          content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        return {
          content: [{ type: "text", text: `Unknown tool: ${name}` }],
          isError: true,
        };
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{ type: "text", text: `Error: ${message}` }],
      isError: true,
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("spec-board-mcp server started");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
