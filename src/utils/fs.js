const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");
const git = require('git-rev-sync');
const { outputPaths, categoryPaths, gitBranch } = require("@/utils/config").value;
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


const filePathisExist = async (filePath) => {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      return resolve(err ? false : true);
    });
  });
};

//写入文件,判断路径是否存在，不存在则创建
const writeFile = async (path, out, name) => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
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
  if (!gitBranch) return;
  const outputPath = path.resolve(__dirname, `../../${outputPaths}`);
  const categoryPath = path.resolve(__dirname, `../../${categoryPaths}`);
  const outputDir = fs.readdirSync(outputPath);
  for (const bookid of outputDir) {
    const bookidDir = fs.readdirSync(`${outputPath}/${bookid}`);
    try {
      bookidDir.sort((a, b) => b.match(/\[(.*)\]|(-)/)[1] - a.match(/\[(.*)\]|(-)/)[1]);
    } catch (error) {
      const msg = `---bookid: ${outputPath}/${bookid}`;
      errorLogger.error(msg + error);
    }
    const out = bookidDir.map((i, e) => {
      const url = `${git.remoteUrl().split(".git")[0]}/blob/${gitBranch}/output/${bookid}/${encodeURI(i)}`;
      return `[${i}](${url})<br>\n`;
    });
    await writeFile(categoryPath, out, bookid);
  }
  await updateReadme();
};


const template = `# 起点本章说
[![Automatic Fetch Reviews](https://github.com/auto-bot-ty/qidian-chapterReview/actions/workflows/fetch.yml/badge.svg?branch=dev)](https://github.com/auto-bot-ty/qidian-chapterReview/actions/workflows/fetch.yml)

---- 
| 书名 | 目录 | 是否更新 | 最后爬取时间 | 网址 |
| --- | --- | --- | --- | --- |`;
//update README.md
const updateReadme = async () => {
  const data = yamltojson();
  if (!data) return;
  const out = data.books.map((i) => {
    const url = `${git.remoteUrl().split(".git")[0]}/tree/${gitBranch}/docs/category/${i.book_id}.md`;
    return `| ${i.book_name} | [${i.book_id}](${url}) | ${i.start == 0 ? "√" : "×"} |  |  |`;
  }).join("\n");
  const readmePath = path.resolve(__dirname, "../../../README.md");
  fs.writeFile(readmePath, template + "\n" + out, { flag: "w" }, (err) => {
    err
      ? errorLogger.info(`README.md 写入失败！\n ${err}`)
      : logger.info(`README.md 写入成功！`);
  }
  );
}
module.exports = {
  writeFile,
  filePathisExist,
  generateCategory,
  get json() {
    return yamltojson();
  },
};
