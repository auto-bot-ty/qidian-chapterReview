const got = require("got");
const fs = require("fs");

const ProcessChapterReview = async (bookId, chapterId, cN, csrfToken) => {
  const path = `./output/${bookId}`;
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) return false;
      });
    }
  });

  const reviewSummaryUrl = `https://read.qidian.com/ajax/chapterReview/reviewSummary?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}`;
  const response = await got.get(reviewSummaryUrl);
  const reviewSummary = JSON.parse(response.body).data.list;
  reviewSummary.sort((a, b) => {
    return a.segmentId - b.segmentId;
  });

  const out = await Promise.all(
    reviewSummary.map(async (item) => {
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${item.segmentId}&type=2&page=1&pageSize=${item.reviewNum}`;
      const response = await got.get(chapterReviewUrl);
      const list = JSON.parse(response.body).data.list;
      if (list.length !== 0) {
        let reviewList = list.map((item) => `>--- ${item.content}<br>\n`);
        reviewList.unshift(`\n[${item.segmentId}] ${list[0].quoteContent}\n`);
        return Promise.resolve(reviewList);
      }
    })
  );

  fs.writeFile(
    `${path}/${cN}.md`,
    out.join("").replace(/,/g, ""),
    {
      flag: "w",
      encoding: "utf-8",
    },
    function (err) {
      console.log(err ? "写入失败" : "写入成功");
    }
  );
};
module.exports = {
  ProcessChapterReview,
};
