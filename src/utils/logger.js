const log4js = require("log4js");
const logger = log4js.getLogger();
const errorLogger = log4js.getLogger("error");

log4js.configure({
  appenders: {
    console: { type: "console" },
    file: {
      type: "file",
      filename: "../logs/out/output.log",
    },
    dayfile: {
      type: "dateFile",
      filename: "../logs/output.log",
      pattern: ".yyyyMMdd",
    },
    error: {
      type: "file",
      filename: "../logs/error.log",
    },
  },
  categories: {
    default: { appenders: ["console", "file"], level: "info" },
    error: { appenders: ["console", "error"], level: "info" },
  },
});

module.exports = { logger, errorLogger };
