const got = require("got");
const books = require("./config.json").books;
const { ProcessChapterReview } = require("./utils");
const csrfToken = "4H73EIrxxJaMWelkAN0MWZaU3SHGWkefJQQzlHWS";

async function getReivew() {
  for (const item of books) {
    if (!item.start) continue;
    // https://book.qidian.com/info/1024655112
    // const categoryUrl = `https://book.qidian.com/ajax/book/category?_csrfToken=${csrfToken}&bookId=${item.bookId}`;
    const categoryUrl = `https://m.qidian.com/majax/book/category?_csrfToken=${csrfToken}&bookId=${item.bookId}`;
    const response = await got.get(categoryUrl);
    const vs = JSON.parse(response.body).data.vs;
    const list = vs[vs.length - 1].cs;
    const newList = list.slice(list.length - item.start, list.length);
    for (const e of newList) {
      if (item.drift) e.cN = `[${e.uuid}] ${e.cN}`;
      await ProcessChapterReview(item.bookId, e.id, e.cN, csrfToken);
    }
  }
}

getReivew();
