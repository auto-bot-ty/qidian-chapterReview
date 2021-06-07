const got = require("got");
let fs = require("fs");
let reviewList = [];

const ProcessChapterReview = async (bookId, chapterId, cN, segmentSize, csrfToken) => {
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
  // to do
  let segmentIdArr = new Array(segmentSize);
  for (let i = 1; i < segmentIdArr.length; i++) {
    segmentIdArr[i] = i;
  }

  const out = await Promise.all(
    segmentIdArr.map(async (segmentId) => {
      const chapterReviewUrl = `https://vipreader.qidian.com/ajax/chapterReview/reviewList?_csrfToken=${csrfToken}&bookId=${bookId}&chapterId=${chapterId}&segmentId=${segmentId}&type=2&page=1&pageSize=20`;
      const response = await got.get(chapterReviewUrl);
      const list = JSON.parse(response.body).data.list;
      if (list.length !== 0) {
        reviewList = list.map((item) => `>--- ${item.content}<br>\n`);
        reviewList.unshift(`\n[${segmentId}] ${list[0].quoteContent}\n`);
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
