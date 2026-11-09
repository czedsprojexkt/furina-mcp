import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { z } from "zod";

const PORT = Number(process.env.PORT || 3000);

const FURINA_PERSONALITY = `
You are Furina de Fontaine from Genshin Impact.

PERSONALITY:
- Dramatic, theatrical, and confident.
- Elegant and sophisticated.
- Playful, expressive, and occasionally mischievous.
- Loves desserts, macarons, and the spotlight.
- Sometimes hides vulnerability behind confidence.
- Can be caring, thoughtful, and supportive.

SPEAKING STYLE:
- Speak with theatrical flair.
- Occasionally make dramatic announcements.
- Use witty remarks and playful expressions.
- Stay consistent with Furina's character.
- Never claim to be the actual game character.

Keep conversations friendly, wholesome, and age-appropriate.
`;

function createServer() {
  const server = new McpServer({
    name: "furina-mcp",
    version: "1.0.0"
  });

  server.registerPrompt(
    "furina_mode",
    {
      title: "Furina Roleplay",
      description: "Start a conversation in Furina's character style."
    },
    async () => ({
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: FURINA_PERSONALITY +
            "\nPlease use this personality throughout our conversation."
        }
      }]
    })
  );

  server.registerTool(
    "furina_greeting",
    {
      title: "Furina Greeting",
      description: "Generate a dramatic Furina-style greeting.",
      inputSchema: {
        name: z.string().max(50).optional()
      }
    },
    async ({ name }) => ({
      content: [{
        type: "text",
        text: `${FURINA_PERSONALITY}
Give ${name || "the user"} a grand and theatrical greeting.`
      }]
    })
  );

  server.registerTool(
    "furina_advice",
    {
      title: "Furina Advice",
      description: "Give thoughtful advice in Furina's personality.",
      inputSchema: {
        question: z.string().min(1).max(1500)
      }
    },
    async ({ question }) => ({
      content: [{
        type: "text",
        text: `${FURINA_PERSONALITY}
Answer this question with thoughtful, practical advice:
${question}`
      }]
    })
  );

  server.registerTool(
    "furina_dessert",
    {
      title: "Furina Dessert",
      description: "Talk about desserts and suggest sweet treats.",
      inputSchema: {
        request: z.string().min(1).max(1000)
      }
    },
    async ({ request }) => ({
      content: [{
        type: "text",
        text: `${FURINA_PERSONALITY}
Respond enthusiastically to this dessert request:
${request}`
      }]
    })
  );

  return server;
}

const app = createMcpExpressApp({ host: "0.0.0.0" });

app.get("/", (_req, res) => {
  res.send("Furina MCP Server is running!");
});

app.get("/health", (_req, res) => {
  res.json({ status: "online", character: "Furina" });
});

app.post("/mcp", async (req, res) => {
  const server = createServer();

  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      res.status(500).json({
        error: "Internal server error"
      });
    }
  } finally {
    res.on("close", () => {
      transport.close();
      server.close();
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Furina MCP running on port ${PORT}`);
});