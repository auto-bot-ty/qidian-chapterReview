const got = require("got");
let fs = require("fs");
let reviewList = [];

const ProcessChapterReview = async (bookId, chapterId, cN, csrfToken) => {
  const path = `./output/${bookId}`;
  fs.access(`${path}`, (err) => {
    if (err) {
      fs.mkdir(`${path}`, function (error) {
        if (error) {
          console.log(error);
          return false;
        }
        console.log("创建目录成功");
      });
    }
  });

  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const response = await got.get(reviewSummaryUrl);
  const reviewSummary = JSON.parse(response.body).data.list;
  reviewSummary.sort((a, b) => { return a.segmentId - b.segmentId })

  const out = await Promise.all(
    reviewSummary.map(async (i) => {
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${i.segmentId}&type=2&page=1&pageSize=${i.reviewNum}`;
      const response = await got.get(chapterReviewUrl);
      const list = JSON.parse(response.body).data.list;
      if (list.length !== 0) {
        reviewList = list.map((item) => `>--- ${item.content}<br>\n`);
        reviewList.unshift(`\n[${i.segmentId}] ${list[0].quoteContent}\n`);
        return Promise.resolve(reviewList);
      }
    })
  );
  fs.writeFile(
    `${path}/${cN}.md`,
    out.join("").replace(/,/g, ""), {
    flag: "w",
    encoding: "utf-8",
  },
    function (err) {
      console.log(!err ? "写入成功" : "写入失败");
    }
  );
};
module.exports = {
  ProcessChapterReview,
};
