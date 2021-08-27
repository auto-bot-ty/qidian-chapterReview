const got = require("got");
const { books } = require("./config.json");
const { ProcessChapterReview, getNewList } = require("./utils");

(async () => {
  for (const item of books) {
    if (!item.start) continue;
    const newList = await getNewList(item.bookId, item.start);
    for (const chapter of newList) {
      if (!item.drift) chapter.cN = `[${chapter.uuid}] ${chapter.cN}`;
      await ProcessChapterReview(chapter.id, chapter.cN);
    }
  }
})();
