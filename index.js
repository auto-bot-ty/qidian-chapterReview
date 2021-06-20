const got = require("got");
let fs = require("fs");
const config = "./config.json";
const { ProcessChapterReview } = require("./utils");
const csrfToken = process.argv[2];
const books = JSON.parse(fs.readFileSync(config)).books;

const getReview = async (bookId, start) => {
  if (csrfToken == "") {
    console.log('csrfToken配置有误，请检查！');
    return false;
  }
  const categoryUrl = `https://book.qidian.com/ajax/book/category?_csrfToken=${csrfToken}&bookId=${bookId}`;
  const response = await got.get(categoryUrl);
  const vs = JSON.parse(response.body).data.vs;
  const list = vs[vs.length - 1].cs;

  list
    .slice(list.length - start, list.length)
    .forEach(
      async (item) =>
        await ProcessChapterReview(bookId, item.id, item.cN, csrfToken)
    );
};

books.forEach(
  async (item) =>
    await getReview(item.bookId, item.start)
);
