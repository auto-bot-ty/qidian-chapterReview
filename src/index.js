const { books, start, lock} = require("../config.json");
const { ProcessChapterReview, getCatalog } = require("./utils");

(async () => {
  for (const item of books) {
    item.start = item.start ?? start;
    if (!item.start) continue;
    const catalog = await getCatalog(item.book_id, item.start, lock);
    for (const chapter of catalog) {
      chapter.cN = `[${chapter.uuid}] ${chapter.cN}`;
      await ProcessChapterReview(chapter.id, chapter.cN);
    }
  }
})();
