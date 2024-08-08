import { createLogger, format, transports } from "winston";

export default (logPath = "") =>
  createLogger({
    level: "info",
    format: format.combine(
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.errors({ stack: true }),
      format.splat(),
      format.json()
    ),
    transports: [
      new transports.File({ filename: `${logPath}error.log`, level: "error" }),
      new transports.File({ filename: `${logPath}combined.log` }),
      new transports.Console({ format: format.simple() }),
    ],
  });
