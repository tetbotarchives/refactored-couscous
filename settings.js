const settings = {
  packname: process.env.BOT_NAME || 'Knight Bot',
  author: '‎',
  botName: process.env.BOT_NAME || "Knight Bot",
  botOwner: process.env.BOT_OWNER || 'Professor',
  ownerNumber: process.env.OWNER_NUMBER || '919876543210',
  giphyApiKey: process.env.GIPHY_API_KEY || 'qnl7ssQChTdPjsKta2Ax2LMaGXz303tq',
  commandMode: "public",
  maxStoreMessages: 20, 
  storeWriteInterval: 10000,
  description: "This is a bot for managing group commands and automating tasks.",
  version: "2.1.9",
  updateZipUrl: "https://github.com/mruniquehacker/Knightbot-MD/archive/refs/heads/main.zip",
};

module.exports = settings;
