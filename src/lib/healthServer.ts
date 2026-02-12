import { WebClient } from "@slack/web-api";
import express, { Request, Response } from "express";
import path from "path";
import { existsSync } from "fs";
import prisma from "./prisma";

export function startHealthServer(slackClient: WebClient): void {
  const app = express();
  const port = process.env.PORT || 3000;

  // Serve static files from web/dist/client (if built)
  const webDistPath = path.join(__dirname, "../../web/dist/client");
  const websiteBuilt = existsSync(webDistPath);

  if (websiteBuilt) {
    app.use(express.static(webDistPath));
  }

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

  // Serve index.html for all other routes (SPA fallback) - only if website is built
  if (websiteBuilt) {
    app.use((req: Request, res: Response) => {
      res.sendFile(path.join(webDistPath, "index.html"));
    });
  } else {
    // Fallback message if website not built
    app.get("*", (req: Request, res: Response) => {
      if (req.path === "/health") return;
      res.status(503).send(`
        <html>
          <head><title>Askify</title></head>
          <body style="font-family: system-ui; max-width: 600px; margin: 100px auto; padding: 20px; text-align: center;">
            <h1>⚡ Askify Bot is Running</h1>
            <p style="color: #666;">Website not built yet. Run <code>npm run web:build</code> to build the website.</p>
            <p><a href="/health">View Health Check</a></p>
          </body>
        </html>
      `);
    });
  }

  app.listen(port, () => {
    console.log(`⚡ Askify bot is running!`);
    console.log(`🌐 Web server listening on port ${port}`);
    if (websiteBuilt) {
      console.log(`   Website: http://localhost:${port}`);
    } else {
      console.log(`   Website: Not built (run 'npm run web:build' to build)`);
    }
    console.log(`   Health: http://localhost:${port}/health`);
  });
}
