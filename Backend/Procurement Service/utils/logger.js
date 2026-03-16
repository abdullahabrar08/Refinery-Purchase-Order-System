const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize } = format;

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const msg = stack ? `${message}\n${stack}` : message;
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `${timestamp} [${level}]: ${msg}${metaStr}`;
});

const logger = createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: combine(timestamp({ format: "YYYY-MM-DD HH:mm:ss" }), colorize(), devFormat),
  transports: [new transports.Console()],
});

logger.stream = { write: (message) => logger.info(message.trim(), { morgan: true }) };

module.exports = logger;
