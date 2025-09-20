const fs = require('fs');
const path = require('path');

// List of emojis for command reactions - you can add more here
let commandEmojis = ['⏳', '❄️', '👾', '🪐', '❤️‍🔥', '💫', '🍁', '🦕', '☕'];

// Path for storing auto-reaction state
const USER_GROUP_DATA = path.join(__dirname, '../data/userGroupData.json');

// Load auto-reaction state from file
function loadAutoReactionState() {
    try {
        if (fs.existsSync(USER_GROUP_DATA)) {
            const data = JSON.parse(fs.readFileSync(USER_GROUP_DATA));
            return data.autoReaction || false;
        }
    } catch (error) {
        console.error('Error loading auto-reaction state:', error);
    }
    return false;
}

// Save auto-reaction state to file
function saveAutoReactionState(state) {
    try {
        const data = fs.existsSync(USER_GROUP_DATA) 
            ? JSON.parse(fs.readFileSync(USER_GROUP_DATA))
            : { groups: [], chatbot: {} };
        
        data.autoReaction = state;
        fs.writeFileSync(USER_GROUP_DATA, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error('Error saving auto-reaction state:', error);
    }
}

// Store auto-reaction state
let isAutoReactionEnabled = loadAutoReactionState();

function getRandomEmoji() {
    // Pick a random emoji from the array
    const randomIndex = Math.floor(Math.random() * commandEmojis.length);
    return commandEmojis[randomIndex];
}

// Function to add emoji to the commandEmojis array
function addEmojiToList(emoji) {
    if (emoji && !commandEmojis.includes(emoji)) {
        commandEmojis.push(emoji);
        console.log(`Added emoji: ${emoji}. Total emojis: ${commandEmojis.length}`);
        return true;
    }
    return false;
}

// Function to remove emoji from the commandEmojis array
function removeEmojiFromList(emoji) {
    const index = commandEmojis.indexOf(emoji);
    if (index > -1) {
        commandEmojis.splice(index, 1);
        console.log(`Removed emoji: ${emoji}. Total emojis: ${commandEmojis.length}`);
        return true;
    }
    return false;
}

// Function to get current emoji list
function getEmojiList() {
    return commandEmojis.join(' ');
}

// Function to add reaction to a command message
async function addCommandReaction(sock, message) {
    try {
        if (!isAutoReactionEnabled || !message?.key?.id) return;
        
        const emoji = getRandomEmoji();
        await sock.sendMessage(message.key.remoteJid, {
            react: {
                text: emoji,
                key: message.key
            }
        });
    } catch (error) {
        console.error('Error adding command reaction:', error);
    }
}

// Function to handle areact command
async function handleAreactCommand(sock, chatId, message, isOwner) {
    try {
        if (!isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command is only available for the owner!',
                quoted: message
            });
            return;
        }

        const args = message.message?.conversation?.split(' ') || [];
        const action = args[1]?.toLowerCase();

        if (action === 'on') {
            isAutoReactionEnabled = true;
            saveAutoReactionState(true);
            await sock.sendMessage(chatId, { 
                text: '✅ Auto-reactions have been enabled globally',
                quoted: message
            });
        } else if (action === 'off') {
            isAutoReactionEnabled = false;
            saveAutoReactionState(false);
            await sock.sendMessage(chatId, { 
                text: '✅ Auto-reactions have been disabled globally',
                quoted: message
            });
        } else if (action === 'add' && args[2]) {
            const emoji = args[2];
            if (addEmojiToList(emoji)) {
                await sock.sendMessage(chatId, { 
                    text: `✅ Emoji ${emoji} has been added to the reaction list!\n\nCurrent emojis: ${getEmojiList()}`,
                    quoted: message
                });
            } else {
                await sock.sendMessage(chatId, { 
                    text: `❌ Emoji ${emoji} is already in the list or invalid!`,
                    quoted: message
                });
            }
        } else if (action === 'remove' && args[2]) {
            const emoji = args[2];
            if (removeEmojiFromList(emoji)) {
                await sock.sendMessage(chatId, { 
                    text: `✅ Emoji ${emoji} has been removed from the reaction list!\n\nCurrent emojis: ${getEmojiList()}`,
                    quoted: message
                });
            } else {
                await sock.sendMessage(chatId, { 
                    text: `❌ Emoji ${emoji} not found in the list!`,
                    quoted: message
                });
            }
        } else if (action === 'list') {
            const emojiList = getEmojiList();
            await sock.sendMessage(chatId, { 
                text: `📋 Current reaction emojis (${commandEmojis.length} total):\n${emojiList}`,
                quoted: message
            });
        } else {
            const currentState = isAutoReactionEnabled ? 'enabled' : 'disabled';
            await sock.sendMessage(chatId, { 
                text: `🤖 Auto-reaction Controller\n\nStatus: ${currentState ? '🟢 Enabled' : '🔴 Disabled'}\nTotal Emojis: ${commandEmojis.length}\n\nCommands:\n.areact on - Enable auto-reactions\n.areact off - Disable auto-reactions\n.areact add [emoji] - Add emoji to list\n.areact remove [emoji] - Remove emoji from list\n.areact list - Show current emojis`,
                quoted: message
            });
        }
    } catch (error) {
        console.error('Error handling areact command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Error controlling auto-reactions',
            quoted: message
        });
    }
}

module.exports = {
    addCommandReaction,
    handleAreactCommand
    // addEmojiToList, // Export for external use if needed
    // getEmojiList    // Export for external use if needed
};
