const fs = require("fs");
const { logger, errorLogger } = require("./logger");

const createBookDir = (path) => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
};

const writeFile = (path, out, chapterName) => {
  fs.writeFile(
    `${path}/${chapterName}.md`,
    out.join("").replace(/,/g, ""),
    { flag: "w" },
    (err) => {
      err
        ? errorLogger.info(`${chapterName} 写入失败！\n ${err}`)
        : logger.info(`${chapterName} 写入成功！`);
    }
  );
};

module.exports = {
  createBookDir,
  writeFile,
};
