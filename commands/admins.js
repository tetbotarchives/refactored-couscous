const settings = require('../settings');
const { getAllSudos } = require('../lib/index'); // You might need to implement/export this!

module.exports = async function whoIsOwnerCommand(sock, chatId, message, args) {
    try {
        // Owner info
        const ownerNumber = settings.ownerNumber;
        const ownerJid = ownerNumber.includes('@s.whatsapp.net') ? ownerNumber : ownerNumber + '@s.whatsapp.net';
        const ownerName = settings.botOwner || "No name set";

        // Sudo users
        let sudoList = [];
        if (typeof getAllSudos === "function") {
            sudoList = await getAllSudos(); // Should return an array of JIDs or numbers
        }

        // Build message
        let text = `🤖 *Bot Owner Info*\n`;
        text += `• Name: ${ownerName}\n`;
        text += `• Number: ${ownerNumber}\n`;
        text += `• JID: ${ownerJid}\n\n`;
        text += `*Sudo Users:*\n`;
        if (sudoList.length > 0) {
            sudoList.forEach((sudo, idx) => {
                text += `  ${idx + 1}. ${sudo}\n`;
            });
        } else {
            text += "  No sudo users set.\n";
        }

        await sock.sendMessage(chatId, { text }, { quoted: message });
    } catch (e) {
        await sock.sendMessage(chatId, { text: `❌ Error: ${e.message}` }, { quoted: message });
    }
};
