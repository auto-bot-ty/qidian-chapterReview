const fs = require("fs");
const got = require("./utils/got");
const { logger, errorLogger } = require("./logs/logger");
let path;
let bookId;
let csrfToken;

const ProcessChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);
  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      //const pageSize = item.reviewNum > 100 ? 100 : item.reviewNum;
      const pageSize = item.reviewNum;
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${item.segmentId}&type=2&page=1&pageSize=${item.pageSize}`;
      const response = await got(chapterReviewUrl);
      const { list } = response.data.data;
      try {
        const content = list.map((item) => `>--- ${item.content.trim()}<br>\n`);
        const quoteContent = [
          `\n[${item.segmentId}] ${list[0].quoteContent.trim()}\n`,
        ];
        return [...quoteContent, ...content];
      } catch (err) {
        const msg = `---bookId: ${bookId} chapterName: ${chapterName}\n---response: ${response.body}\n---chapterReviewUrl: ${chapterReviewUrl}`;
        errorLogger.info(`${err} \n ${msg}`);
        return `\n[${item.segmentId}] invalid list\n`;
      }
    })
  );
  createBookDir();
  writeFile(out, chapterName);
};

const getNewList = async (bid, start) => {
  await assignmentGlobalVariables(bid);
  const categoryUrl = `https://m.qidian.com/majax/book/category?_csrfToken=${csrfToken}&bookId=${bookId}`;
  const { data } = await got(categoryUrl).then((res) => res.data);
  const { bookName } = data;
  logger.info(
    `${bookName}  (${
      process.env.DOWNSTREAM_BRANCH || "local"
    }/${bookId}) \n================================`
  );
  let list = [];
  data.vs.forEach((e) => (list = [...list, ...e.cs]));
  start = start > list.length ? list.length : start;
  const githubActionsLimit = 10;
  if (process.env.GITHUB_REPOSITORY && start > githubActionsLimit) {
    start = githubActionsLimit;
    logger.info(`触发 demo 限制，重置 start 为 ${start}`);
  }
  logger.info(`抓取最新 ${start} 章`);
  const newList = list.slice(-start);
  return newList;
};

const getReviewSummary = async (chapterId) => {
  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const reviewSummary = await got(reviewSummaryUrl).then(
    (res) => res.data.data.list
  );
  reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
  return reviewSummary.filter((e) => e.reviewNum !== 0);
};

const assignmentGlobalVariables = async (bid) => {
  bookId = bid;
  csrfToken = await fetchCsrfToken();
  path = `./output/${bookId}`;
};

const fetchCsrfToken = async () => {
  return await got(`https://m.qidian.com/book/${bookId}/catalog`).then(
    (res) => res.headers["set-cookie"].join("").match(/_csrfToken=(\S*);/)[1]
  );
};

const createBookDir = () => {
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
      });
    }
  });
};

const writeFile = (out, chapterName) => {
  fs.writeFile(
    `${path}/${chapterName}.md`,
    out.join("").replace(/,/g, ""),
    { flag: "w" },
    (err) => {
      err ? errorLogger.info(`${chapterName} 写入失败！\n ${err}`) : logger.info(`${chapterName} 写入成功！`)
    }
  );
};

module.exports = {
  ProcessChapterReview,
  getNewList,
};
