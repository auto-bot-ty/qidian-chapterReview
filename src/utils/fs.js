const fs = require("fs");
const path = require('path');
const yaml = require('js-yaml');
const { logger, errorLogger } = require("@/utils/logger");


const yamltojson = () => {
  try {
    const filePath = path.resolve(__dirname, '../../config.yaml');
    const data = yaml.load(fs.readFileSync(filePath, 'utf8'));
    return data;
  } catch (error) {
    errorLogger.error(error);
    return null;
  }
}


const createBookDir = (path) => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
};


const filePathisExist= async(filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      return resolve(err ? false : true)
    })
  })
}

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
  filePathisExist,
  get json() {
    return yamltojson();
  }
};
