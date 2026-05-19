import pino from "pino";

import config from "./environment.js";

const isDev = config.app.environment === "development";

const logger = pino({
  level: isDev ? "debug" : "info",
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
        },
      }
    : undefined,
});

export default logger;
