import arcjet, { detectBot, shield, slidingWindow } from "@arcjet/node";
import type { NextFunction, Response, Request } from "express";

const key = process.env.ARCJET_KEY;
const mode = process.env.ARCJET_ENV === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!key) throw new Error("ARCJET_KEY env variable is missing");

export const httpArcjet = key
  ? arcjet({
      key,
      rules: [
        shield({ mode }),
        detectBot({
          mode,
          allow: [
            "CATEGORY:SEARCH_ENGINE",
            "CATEGORY:PREVIEW",
            "CATEGORY:MONITOR",
          ],
        }),
        slidingWindow({ mode, interval: "10s", max: 50 }),
      ],
    })
  : null;

export const wsArcjet = key
  ? arcjet({
      key,
      rules: [
        shield({ mode }),
        detectBot({
          mode,
          allow: [
            "CATEGORY:SEARCH_ENGINE",
            "CATEGORY:PREVIEW",
            "CATEGORY:MONITOR",
          ],
        }),
        slidingWindow({ mode, interval: "2s", max: 5 }),
      ],
    })
  : null;

export const securityMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!httpArcjet) return next();
    try {
      const decision = await httpArcjet.protect(req);
      if (decision.isDenied()) {
        if (decision.reason.isRateLimit()) {
          return res.status(429).json({ message: "Too many request" });
        }
        return res.status(403).json({ message: "Forbidden" });
      }
      next();
    } catch (error) {
      console.error("Arcjet middleware error", error);
      return res.status(503).json({ message: "Service unavailable" });
    }
  };
};
