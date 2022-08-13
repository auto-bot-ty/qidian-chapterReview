const Path = require("path");
const got = require("@/utils/got");
const { outputPaths, githubRepository } = require("@/utils/config").value;
const { writeFile, filePathisExist } = require("@/utils/fs");
const { logger, errorLogger } = require("@/utils/logger");
let path;
let bookId;
let csrfToken;

const processChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);
  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      //const pageSize = item.reviewNum > 100 ? 100 : item.reviewNum;
      const pageSize = item.reviewNum;
      const chapterReviewUrl =
        "https://vipreader.qidian.com/ajax/chapterReview/reviewList";
      const paramsList = {
        bookId,
        page: 1,
        type: 2,
        chapterId,
        _csrfToken: csrfToken,
        pageSize,
        segmentId: item.segmentId,
      };
      const response = await got(chapterReviewUrl, {
        searchParams: new URLSearchParams(paramsList),
      });
      try {
        const { list } = response.data.data;
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
  writeFile(path, out, chapterName);
};

const getCatalog = async (bid, start, total, lock) => {
  await assignmentGlobalVariables(bid);
  const categoryUrl = `https://m.qidian.com/majax/book/category?_csrfToken=${csrfToken}&bookId=${bookId}`;
  const { data } = await got(categoryUrl).then((res) => res.data);
  const { bookName } = data;
  logger.info(
    `${bookName}  (${process.env.DOWNSTREAM_BRANCH || "local"
    }/${bookId}) \n================================`
  );
  if (!(await filePathisExist(path))) total = 1;
  return getSlicesCatalog(data, start, total, lock);
};

const getSlicesCatalog = (data, start, total, lock) => {
  let catalogList = [];
  data.vs.forEach((e) => (catalogList = [...catalogList, ...e.cs]));
  if (lock) {
    logger.info("仅抓取付费章！");
    catalogList = catalogList.filter((e) => e.sS !== 1);
  }
  if (total || start > catalogList.length) {
    start = catalogList.length;
  }
  const githubActionsLimit = 10;
  if (process.env.GITHUB_REPOSITORY !== githubRepository && start > githubActionsLimit) {
    start = githubActionsLimit;
    logger.info(`触发 demo 限制，重置 start 为 ${start}`);
  }
  logger.info(`抓取${start === catalogList.length ? '全部，共' : '最新'} ${start} 章`);
  return catalogList.slice(-start);
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
  path = Path.resolve(__dirname, `../${outputPaths}/${bookId}`);
};
// 获取 csrfToken
const fetchCsrfToken = async () => {
  return await got(`https://m.qidian.com/book/${bookId}/catalog`).then(
    (res) => res.headers["set-cookie"].join("").match(/_csrfToken=(\S*);/)[1]
  );
};

module.exports = {
  processChapterReview,
  getCatalog,
};
