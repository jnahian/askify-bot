import { WebClient } from "@slack/web-api";
import express, { Request, Response } from "express";
import path from "path";
import { fileURLToPath } from "url";
import prisma from "./prisma";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function startHealthServer(slackClient: WebClient): void {
  const app = express();
  const port = process.env.PORT || 3000;

  // Serve static files from web/dist/client
  const webDistPath = path.join(__dirname, "../../web/dist/client");
  app.use(express.static(webDistPath));

  // Health check endpoint
  app.get("/health", async (req: Request, res: Response) => {
    try {
      // Check database connectivity
      await prisma.$queryRaw`SELECT 1`;

      // Check Slack client (auth.test is lightweight)
      await slackClient.auth.test();

      res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        checks: {
          database: "connected",
          slack: "connected",
        },
      });
    } catch (error) {
      console.error("Health check failed:", error);
      res.status(503).json({
        status: "error",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Serve index.html for all other routes (SPA fallback)
  app.get("*", (req: Request, res: Response) => {
    // Don't interfere with health check
    if (req.path === "/health") {
      return;
    }
    res.sendFile(path.join(webDistPath, "index.html"));
  });

  app.listen(port, () => {
    console.log(`🌐 Website & health server listening on port ${port}`);
    console.log(`   Website: http://localhost:${port}`);
    console.log(`   Health: http://localhost:${port}/health`);
  });
}
