require('dotenv').config();
let envs = process.env;
let value = {
  ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_13_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.3325.181 Safari/537.36",
  requestRetry: 2,
  requestTimeout: 30000,
  prefixPath: envs.OUTPUT_PATH || "../output/",
  logsPath: envs.LOGS_PATH || "../logs",
  githubRepository: "auto-bot-ty/qidian-chapterReview",
};

module.exports = {
  get value() {
    return value;
  },
};
