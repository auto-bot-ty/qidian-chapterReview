const fs = require("fs");
const got = require("got");
let path;
let bookId;
let csrfToken;

const ProcessChapterReview = async (chapterId, chapterName) => {
  const reviewSummary = await getReviewSummary(chapterId);
  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      const pageSize = item.reviewNum > 98 ? "98" : item.reviewNum;
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${item.segmentId}&type=2&page=1&pageSize=${pageSize}`;
      const response = await got.get(chapterReviewUrl);
      try {
        const list = JSON.parse(response.body).data.list;
        const content = list.map((item) => `>--- ${item.content.trim()}<br>\n`);
        const quoteContent = [
          `\n[${item.segmentId}] ${list[0].quoteContent.trim()}\n`,
        ];
        return [...quoteContent, ...content];
      } catch (err) {
        const msg = `[error] invalid list (${item.segmentId})\n---response: ${response.body}\n---chapterReviewUrl: ${chapterReviewUrl}`;
        console.log(msg);
        return `\n[${item.segmentId}] invalid list\n`;
      }
    })
  );
  writeFile(out, chapterName);
};

const getNewList = async (bid, start) => {
  bookId = bid;
  mkdirBookDir();
  csrfToken = await getCsrfToken();
  const categoryUrl = `https://m.qidian.com/majax/book/category?_csrfToken=${csrfToken}&bookId=${bookId}`;
  const response = await got.get(categoryUrl);
  const data = JSON.parse(response.body).data;
  const vs = data.vs;
  const bookName = data.bookName;
  console.log(`${bookName}\n================================`);
  const list = vs[vs.length - 1].cs;
  start = start > list.length ? list.length : start;
  console.log(`抓取最新 ${start} 章`);
  const newList = list.slice(-start);
  return newList;
};

const getReviewSummary = async (chapterId) => {
  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const response = await got.get(reviewSummaryUrl);
  const reviewSummary = JSON.parse(response.body).data.list;
  reviewSummary.sort((a, b) => a.segmentId - b.segmentId);
  return reviewSummary;
};

const getCsrfToken = async () => {
  const response = await got.get(`https://m.qidian.com/book/${bookId}/catalog`);
  const _csrfToken = response.headers["set-cookie"]
    .join("")
    .match(/_csrfToken=(\S*);/)[1];
  return _csrfToken;
};

const mkdirBookDir = () => {
  path = `./output/${bookId}`;
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
      console.log(
        err ? `${chapterName} 写入失败！` : `${chapterName} 写入成功！`
      );
    }
  );
};

module.exports = {
  ProcessChapterReview,
  getNewList,
};
