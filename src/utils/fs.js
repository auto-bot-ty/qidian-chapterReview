const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const git = require('git-rev-sync');
const { outputPaths, categoryPaths } = require("@/utils/config").value;
const { logger, errorLogger } = require("@/utils/logger");

const yamltojson = () => {
  try {
    const filePath = path.resolve(__dirname, "../../config.yaml");
    const data = yaml.load(fs.readFileSync(filePath, "utf8"));
    return data;
  } catch (error) {
    errorLogger.error(error);
    return null;
  }
};

const createBookDir = async (path) => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
};

const filePathisExist = async (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      return resolve(err ? false : true);
    });
  });
};

const writeFile = async (path, out, name) => {
  fs.writeFile(
    `${path}/${name}.md`,
    out.join("").replace(/,/g, ""),
    { flag: "w" },
    (err) => {
      err
        ? errorLogger.info(`${name} 写入失败！\n ${err}`)
        : logger.info(`${name} 写入成功！`);
    }
  );
};

const generateCategory = async () => {
  const outputPath = path.resolve(__dirname, `../${outputPaths}`);
  const categoryPath = path.resolve(__dirname, `../../${categoryPaths}`);
  const outputDir = fs.readdirSync(outputPath);
  for (const bookid of outputDir) {
    if (bookid !== '1016150754') {
      const bookidDir = fs.readdirSync(`${outputPath}/${bookid}`);
      try {
        bookidDir.sort((a, b) => b.match(/\[(.*)\]|(-)/)[1] - a.match(/\[(.*)\]|(-)/)[1]);
      } catch (error) {
        const msg = `---bookid: ${bookid}`
        errorLogger.error(msg + error);
      }
      const out = bookidDir.map((i, e) => {
        const url = `${git.remoteUrl().split(".git")[0]}/blob/master/output/${bookid}/${encodeURI(i)}`;
        return `[${i}](${url})<br>\n`;
      });
      const result = await filePathisExist(categoryPath);
      if (!result) {
        await createBookDir(categoryPath);
      }
      await writeFile(categoryPath, out, bookid);
    }
  }
};

module.exports = {
  createBookDir,
  writeFile,
  filePathisExist,
  generateCategory,
  get json() {
    return yamltojson();
  },
};
