const got = require("got");
const fs = require("fs");

const ProcessChapterReview = async (bookId, chapterId, cN, csrfToken) => {
  const path = `../output/${bookId}`;
  fs.access(path, (err) => {
    if (err) {
      fs.mkdir(path, { recursive: true }, (err) => {
        if (err) throw err;
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
      const pageSize = item.reviewNum > 98 ? "98" : item.reviewNum;
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${item.segmentId}&type=2&page=1&pageSize=${pageSize}`;
      const response = await got.get(chapterReviewUrl);
      try {
        const list = JSON.parse(response.body).data.list;
        let reviewList = list.map(
          (item) => `>--- ${item.content.trim()}<br>\n`
        );
        reviewList.unshift(
          `\n[${item.segmentId}] ${list[0].quoteContent.trim()}\n`
        );
        return reviewList;
      } catch (err) {
        console.log(
          `[error] invalid list (${item.segmentId})\n---response: ${response.body}\n---chapterReviewUrl: ${chapterReviewUrl}`
        );
        return `\n[${item.segmentId}] invalid list\n`;
      }
    })
  );

  fs.writeFile(
    `${path}/${cN}.md`,
    out.join("").replace(/,/g, ""),
    { flag: "w" },
    (err) => {
      console.log(err ? `${cN} 写入失败！` : `${cN} 写入成功！`);
    }
  );
};

module.exports = {
  ProcessChapterReview,
};
