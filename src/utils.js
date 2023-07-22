const Path = require("path");
const got = require("@/utils/got");
const { outputPaths, githubRepository } = require("@/utils/config").value;
const { writeFile } = require("@/utils/fs");
const { logger, errorLogger } = require("@/utils/logger");
let path;
let bookId;
let csrfToken;
let headers;

const processChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);
  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      const chapterReviewUrl = "https://vipreader.qidian.com/ajax/chapterReview/reviewList";
      const paramsList = {
        bookId,
        page: 1,
        type: 2,
        chapterId,
        _csrfToken: csrfToken,
        pageSize: item.reviewNum,
        segmentId: item.segmentId,
      };
      try {
        const response = await got(chapterReviewUrl, { searchParams: new URLSearchParams(paramsList) }, { headers });
        const { data: { list } } = JSON.parse(response.body);
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
  const categoryUrl = `https://m.qidian.com/majax/book/category?bookId=${bookId}&_csrfToken=${csrfToken}`;
  const { data } = await got(categoryUrl, { headers })
  const { data : {bookName, vs} } = data
  logger.info(
    `${bookName}  (${process.env.DOWNSTREAM_BRANCH || "local"
    }/${bookId}) \n================================`
  );
  return getSlicesCatalog(vs, start, total, lock);
};

const getSlicesCatalog = (vs, start, total, lock) => {
  let catalogList = [];
  for (const { cs } of vs) {
    catalogList.push(...cs);
  }
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
  logger.info(`抓取${start === catalogList.length ? "全部，共" : "最新"} ${start} 章`);
  return catalogList.slice(-start);
};

const getReviewSummary = async (chapterId) => {
  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const reviewSummary = await got(reviewSummaryUrl, { headers }).then(
    (res) => res.data.data.list
  );
  reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
  return reviewSummary.filter((e) => e.reviewNum !== 0);
};

const assignmentGlobalVariables = async (bid) => {
  bookId = bid;
  if (typeof (csrfToken) === "undefined") {
    csrfToken = await fetchCsrfToken();
  }
  headers = {
    Cookie: `_csrfToken=${csrfToken}`,
  };
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
