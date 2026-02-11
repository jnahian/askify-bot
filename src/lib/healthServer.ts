import { WebClient } from "@slack/web-api";
import express, { Request, Response } from "express";
import prisma from "./prisma";

export function startHealthServer(slackClient: WebClient): void {
  const app = express();
  const port = process.env.PORT || 3000;

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

  app.listen(port, () => {
    console.log(`Health server listening on port ${port}`);
  });
}
