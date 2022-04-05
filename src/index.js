const { books, start, lock } = require("./utils/fs").json;
const { processChapterReview, getCatalog } = require("./utils");

(async () => {
  for (const item of books) {
    item.start ?? (item.start = start);
    if (!item.start) continue;
    const catalog = await getCatalog(item.book_id, item.start, item.total, lock);
    for (const chapter of catalog) {
      chapter.cN = `[${chapter.uuid}] ${chapter.cN}`;
      await processChapterReview(chapter.id, chapter.cN);
    }
  }
})();
