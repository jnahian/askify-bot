import { WebClient } from "@slack/web-api";
import express, { Request, Response } from "express";
import path from "path";
import { existsSync } from "fs";
import prisma from "./prisma";

export function startHealthServer(slackClient: WebClient): void {
  const app = express();
  const port = process.env.PORT || 3000;

  // Check if website is built
  const webServerPath = path.join(__dirname, "../../web/dist/server/server.js");
  const websiteBuilt = existsSync(webServerPath);

  // Health check endpoint (must be before other routes)
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
          website: websiteBuilt ? "built" : "not built",
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

  // Serve website if built (TanStack Start SSR server)
  if (websiteBuilt) {
    // Import and use the TanStack Start server
    import(webServerPath)
      .then((webServer) => {
        // TanStack Start's server exports a handler
        if (webServer.default || webServer.handler) {
          const handler = webServer.default || webServer.handler;
          app.use(handler);
        }
      })
      .catch((err) => {
        console.error("Failed to load website server:", err);
      });
  } else {
    // Fallback message if website not built
    app.get("*", (req: Request, res: Response) => {
      res.status(503).send(`
        <html>
          <head><title>Askify</title><style>body{font-family:system-ui;max-width:600px;margin:100px auto;padding:20px;text-align:center;background:#0b1118;color:#fff;}</style></head>
          <body>
            <h1>⚡ Askify Bot is Running</h1>
            <p style="color: #b9c6d8;">Website not built yet. Run <code style="background:#16212c;padding:4px 8px;border-radius:4px;">npm run web:build</code> to build the website.</p>
            <p><a href="/health" style="color:#0f9ea8;">View Health Check</a></p>
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
