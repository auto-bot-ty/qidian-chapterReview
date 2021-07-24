const { TelegramClient } = require("messaging-api-telegram");
const LCL = require("last-commit-log");
const chatId = process.argv[2];
const accessToken = process.argv[3];
const eventName = process.argv[4];

const telegramPush = () => {
  if (!chatId || !accessToken) throw "推送配置有误，请检查！";
  const lcl = new LCL();
  const commit = lcl.getLastCommitSync();
  const client = new TelegramClient({ accessToken });
  // https://yoctol.github.io/messaging-apis/latest/classes/messaging_api_telegram.telegramclient-1.html#sendmessage
  const message = `本章说更新！---${eventName} \n${commit.gitUrl}/commit/${commit.hash} \n小说网站 \nhttps://www.biquge5200.cc/125_125197`;

  client
    .sendMessage(chatId, message, {
      disableWebPagePreview: true,
      disableNotification: true,
    })
    .then(() => console.log("推送成功！"));
};

telegramPush();
