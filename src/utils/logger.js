const log4js = require("log4js");
const logger = log4js.getLogger();
const errorLogger = log4js.getLogger("error");
const { logsPath } = require("@/utils/config").value;


log4js.configure({
  appenders: {
    console: { type: "console" },
    file: {
      type: "file",
      filename: `${logsPath}/out/output.log`,
    },
    dayfile: {
      type: "dateFile",
      filename: `${logsPath}/output.log`,
      pattern: ".yyyyMMdd",
    },
    error: {
      type: "file",
      filename: `${logsPath}/error.log`,
    },
  },
  categories: {
    default: { appenders: ["console", "file"], level: "info" },
    error: { appenders: ["console", "error"], level: "info" },
  },
});

module.exports = { logger, errorLogger };
