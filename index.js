const got = require("got");
const fs = require("fs");
const config = "./config.json";
const csrfToken = process.argv[2];
const { ProcessChapterReview } = require("./utils");
const books = JSON.parse(fs.readFileSync(config)).books;

async function getReivew() {
  if (csrfToken === "") {
    console.log("csrfToken 配置有误，请检查！");
    return false;
  }

  for (const item of books) {
    const categoryUrl = `https://book.qidian.com/ajax/book/category?_csrfToken=${csrfToken}&bookId=${item.bookId}`;
    const response = await got.get(categoryUrl);
    const vs = JSON.parse(response.body).data.vs;
    const list = vs[vs.length - 1].cs;
    const newList = list.slice(list.length - item.start, list.length);
    for (const e of newList) {
      await ProcessChapterReview(item.bookId, e.id, e.cN, csrfToken);
    }
  }
}

getReivew();
