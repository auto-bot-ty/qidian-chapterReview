const got = require("got");
const books = require("./config.json").books;
const { ProcessChapterReview, getNewList } = require("./utils");
const csrfToken = "4H73EIrxxJaMWelkAN0MWZaU3SHGWkefJQQzlHWS";

(async () => {
  for (const item of books) {
    if (!item.start) continue;
    const newList = await getNewList(item.bookId, item.start, csrfToken);
    for (const e of newList) {
      if (!item.drift) e.cN = `[${e.uuid}] ${e.cN}`;
      await ProcessChapterReview(item.bookId, e.id, e.cN, csrfToken);
    }
  }
})();
