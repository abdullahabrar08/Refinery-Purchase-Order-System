const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, errors, json, colorize } = format;
const { api } = require("../config");

const isProdLike = api.environment !== "development";

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const msg = stack ? `${message}\n${stack}` : message;
  const metaStr =
    Object.keys(meta).length > 0 ? `\n${JSON.stringify(meta, null, 2)}` : "";
  return `${timestamp} [${level}]: ${msg}${metaStr}`;
});

const shortFormat = printf((info) => {
  const { timestamp, level, message, service, ...meta } = info;
  return JSON.stringify({
    timestamp,
    level,
    message,
    service,
    ...meta, // Include all additional data
  });
});

const stripStack = format((info) => {
  if (info.stack) delete info.stack;
  return info;
});

const logger = createLogger({
  level: api.nodeLevel,
  // defaultMeta: { service: api.serviceName },
  format: isProdLike
    ? combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: false }),
        stripStack(),
        shortFormat
      )
    : combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: true }),
        colorize(),
        devFormat
      ),
  transports: [new transports.Console()],
  exitOnError: false,
});

if (isProdLike) {
  logger.add(
    new transports.File({
      filename: "logs/error.log",
      level: "error",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: false }),
        stripStack(),
        shortFormat
      ),
    })
  );

  logger.add(
    new transports.File({
      filename: "logs/combined.log",
      maxsize: 5 * 1024 * 1024,
      maxFiles: 5,
      format: combine(
        timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
        errors({ stack: false }),
        stripStack(),
        shortFormat
      ),
    })
  );
}

logger.exceptions.handle(
  ...(isProdLike
    ? [
        new transports.File({
          filename: "logs/exceptions.log",
          maxsize: 5 * 1024 * 1024,
          maxFiles: 5,
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: false }),
            stripStack(),
            shortFormat
          ),
        }),
        new transports.Console({
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: false }),
            stripStack(),
            shortFormat
          ),
        }),
      ]
    : [
        new transports.Console({
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: true }),
            colorize(),
            devFormat
          ),
        }),
      ])
);

logger.rejections.handle(
  ...(isProdLike
    ? [
        new transports.File({
          filename: "logs/rejections.log",
          maxsize: 5 * 1024 * 1024,
          maxFiles: 5,
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: false }),
            stripStack(),
            shortFormat
          ),
        }),
        new transports.Console({
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: false }),
            stripStack(),
            shortFormat
          ),
        }),
      ]
    : [
        new transports.Console({
          format: combine(
            timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
            errors({ stack: true }),
            colorize(),
            devFormat
          ),
        }),
      ])
);

logger.stream = {
  write: (message) => logger.info(message.trim(), { morgan: true }),
};

module.exports = logger;
