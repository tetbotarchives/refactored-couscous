const fs = require('fs');
const path = require('path');
const { isSudo } = require('../lib/index');

// Template for new commands
const commandTemplate = (commandName, userCode) => `// Auto-generated command: ${commandName}
// Created via .cmd command
// WARNING: This is dynamically generated code. Be careful with modifications.

const channelInfo = {
    contextInfo: {
        forwardingScore: 1,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'KnightBot MD',
            serverMessageId: -1
        }
    }
};

module.exports = async function ${commandName}Command(sock, chatId, message, args) {
    try {
        ${userCode}
    } catch (error) {
        console.error(\`Error in \${commandName} command:\`, error);
        await sock.sendMessage(chatId, {
            text: \`❌ Error executing command: \${error.message}\`,
            ...channelInfo
        }, { quoted: message });
    }
};`;

async function cmdCommand(sock, chatId, message, args) {
    const senderId = message.key.participant || message.key.remoteJid;
    const channelInfo = {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363161513685998@newsletter',
                newsletterName: 'KnightBot MD',
                serverMessageId: -1
            }
        }
    };

    // Check if user is owner/sudo
    const isSenderSudo = await isSudo(senderId);
    if (!message.key.fromMe && !isSenderSudo) {
        await sock.sendMessage(chatId, {
            text: '❌ This command is only available for the bot owner!',
            ...channelInfo
        }, { quoted: message });
        return;
    }

    const commandsDir = path.join(__dirname);
    const input = args.join(' ').trim();

    if (!input) {
        await sock.sendMessage(chatId, {
            text: `📋 *Command Manager*

*Usage:*
• \`.cmd -i filename.js\` - Install new command
  (Send the command code in next message)
• \`.cmd rm filename.js\` - Remove command
• \`.cmd list\` - List custom commands

*Example:*
\`.cmd -i greet.js\`
Then send:
\`\`\`
await sock.sendMessage(chatId, {
    text: 'Hello! This is a custom greeting!',
    ...channelInfo
}, { quoted: message });
\`\`\``,
            ...channelInfo
        }, { quoted: message });
        return;
    }

    const parts = input.split(' ');
    const action = parts[0];
    const filename = parts[1];

    try {
        switch (action) {
            case '-i':
            case 'install':
                if (!filename || !filename.endsWith('.js')) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Please provide a valid filename ending with .js\n\nExample: `.cmd -i greet.js`',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                const commandName = installBaseName.replace('.js', '');
                
                // Sanitize filename to prevent path traversal
                const installBaseName = path.basename(filename);
                if (installBaseName !== filename || installBaseName.includes('..') || !/^[a-zA-Z0-9_-]+\.js$/.test(installBaseName)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Invalid filename. Use only letters, numbers, hyphens, and underscores followed by .js',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                
                // Check if command already exists
                const filePath = path.join(commandsDir, installBaseName);
                if (fs.existsSync(filePath)) {
                    await sock.sendMessage(chatId, {
                        text: `⚠️ Command "${commandName}" already exists. Please use a different name or remove it first.`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                // Store installation request for next message
                global.pendingCommandInstall = {
                    chatId,
                    senderId,
                    filename,
                    commandName,
                    timestamp: Date.now()
                };

                await sock.sendMessage(chatId, {
                    text: `📝 *Installing Command: ${commandName}*

Please send the command code in your next message.

*Available variables:*
• \`sock\` - WhatsApp socket
• \`chatId\` - Current chat ID
• \`message\` - Message object
• \`args\` - Command arguments array
• \`channelInfo\` - Channel context info

*Example code:*
\`\`\`javascript
await sock.sendMessage(chatId, {
    text: 'Hello from custom command!',
    ...channelInfo
}, { quoted: message });
\`\`\`

⏱️ You have 2 minutes to send the code.`,
                    ...channelInfo
                }, { quoted: message });

                // Clear pending install after 2 minutes
                const installTimestamp = global.pendingCommandInstall.timestamp;
                setTimeout(() => {
                    if (global.pendingCommandInstall && 
                        global.pendingCommandInstall.chatId === chatId && 
                        global.pendingCommandInstall.timestamp === installTimestamp) {
                        delete global.pendingCommandInstall;
                    }
                }, 120000);

                break;

            case 'rm':
            case 'remove':
                if (!filename || !filename.endsWith('.js')) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Please provide a valid filename ending with .js\n\nExample: `.cmd rm greet.js`',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }
                
                // Sanitize filename to prevent path traversal
                const removeBaseName = path.basename(filename);
                if (removeBaseName !== filename || removeBaseName.includes('..') || !/^[a-zA-Z0-9_-]+\.js$/.test(removeBaseName)) {
                    await sock.sendMessage(chatId, {
                        text: '❌ Invalid filename. Use only letters, numbers, hyphens, and underscores followed by .js',
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                const removeFilePath = path.join(commandsDir, removeBaseName);
                if (!fs.existsSync(removeFilePath)) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Command "${filename}" not found.`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                // Check if it's a core command (prevent deletion of important commands)
                const coreCommands = [
                    'help.js', 'ban.js', 'kick.js', 'promote.js', 'demote.js',
                    'mute.js', 'unmute.js', 'owner.js', 'settings.js', 'cmd.js'
                ];

                if (coreCommands.includes(removeBaseName)) {
                    await sock.sendMessage(chatId, {
                        text: `❌ Cannot remove core command "${removeBaseName}". This command is essential for bot functionality.`,
                        ...channelInfo
                    }, { quoted: message });
                    return;
                }

                fs.unlinkSync(removeFilePath);
                
                // Clear require cache if it was loaded
                try {
                    const resolvedPath = require.resolve(removeFilePath);
                    delete require.cache[resolvedPath];
                } catch (e) {
                    // File wasn't in cache, that's fine
                }
                
                await sock.sendMessage(chatId, {
                    text: `✅ Command "${removeBaseName}" has been removed successfully and is no longer available.`,
                    ...channelInfo
                }, { quoted: message });

                // Log the removal
                if (global.addBotLog) {
                    global.addBotLog('info', `Command ${filename} removed by ${senderId}`);
                }

                break;

            case 'list':
                const customCommandsPath = commandsDir;
                const allCommands = fs.readdirSync(customCommandsPath)
                    .filter(file => file.endsWith('.js'))
                    .sort();

                const coreCommandsList = [
                    'help.js', 'ban.js', 'kick.js', 'promote.js', 'demote.js',
                    'mute.js', 'unmute.js', 'owner.js', 'settings.js', 'cmd.js',
                    'tagall.js', 'ping.js', 'alive.js', 'sticker.js'
                ];

                const customCommands = allCommands.filter(cmd => !coreCommandsList.includes(cmd));

                let commandList = `📋 *Command List*\n\n`;
                commandList += `*Core Commands:* ${coreCommandsList.length}\n`;
                commandList += `*Custom Commands:* ${customCommands.length}\n\n`;

                if (customCommands.length > 0) {
                    commandList += `*Custom Commands:*\n`;
                    customCommands.forEach((cmd, index) => {
                        const stats = fs.statSync(path.join(customCommandsPath, cmd));
                        const created = stats.birthtime.toLocaleDateString();
                        commandList += `${index + 1}. ${cmd} (${created})\n`;
                    });
                } else {
                    commandList += `*Custom Commands:*\nNo custom commands installed.\n`;
                }

                commandList += `\n*Total Commands:* ${allCommands.length}`;

                await sock.sendMessage(chatId, {
                    text: commandList,
                    ...channelInfo
                }, { quoted: message });

                break;

            default:
                await sock.sendMessage(chatId, {
                    text: `❌ Unknown action: ${action}

*Available actions:*
• \`-i\` or \`install\` - Install new command
• \`rm\` or \`remove\` - Remove command  
• \`list\` - List all commands`,
                    ...channelInfo
                }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in cmd command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Error: ${error.message}`,
            ...channelInfo
        }, { quoted: message });
    }
}

// Function to handle pending command installation
async function handleCommandInstallation(sock, chatId, message, codeText) {
    const channelInfo = {
        contextInfo: {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363161513685998@newsletter',
                newsletterName: 'KnightBot MD',
                serverMessageId: -1
            }
        }
    };

    try {
        const { filename, commandName } = global.pendingCommandInstall;
        const commandsDir = path.join(__dirname);
        const filePath = path.join(commandsDir, filename);

        // Basic code validation
        if (!codeText || codeText.trim().length < 10) {
            await sock.sendMessage(chatId, {
                text: '❌ Code is too short. Please provide valid JavaScript code.',
                ...channelInfo
            }, { quoted: message });
            return;
        }

        // Check for potentially dangerous code - comprehensive security check
        const dangerousPatterns = [
            // Process and system access
            /process\./gi,
            /global\./gi,
            /\brequire\s*\(/gi,  // Block all require usage
            // File system operations
            /fs\./gi,
            /fs\//gi,
            /path\./gi,
            // Network and child processes
            /child_process/gi,
            /net\./gi,
            /http\./gi,
            /https\./gi,
            /dgram\./gi,
            /cluster\./gi,
            /worker_threads/gi,
            // Code execution
            /eval\s*\(/gi,
            /Function\s*\(/gi,
            /setTimeout\s*\(/gi,
            /setInterval\s*\(/gi,
            /setImmediate\s*\(/gi,
            // VM and dangerous modules
            /vm\./gi,
            /os\./gi,
            /crypto\./gi,
            // Direct file operations
            /writeFile/gi,
            /readFile/gi,
            /unlink/gi,
            /mkdir/gi,
            /rmdir/gi,
            /rename/gi,
            /copy/gi,
            /move/gi
        ];

        const foundDangerous = dangerousPatterns.find(pattern => pattern.test(codeText));
        if (foundDangerous) {
            await sock.sendMessage(chatId, {
                text: `❌ Code contains dangerous operations (${foundDangerous.source}). For security reasons, this command cannot be installed.\n\n⚠️ Only use safe operations like sending messages, basic string/array operations, and math functions.`,
                ...channelInfo
            }, { quoted: message });
            delete global.pendingCommandInstall;
            return;
        }

        // Generate command file
        const commandCode = commandTemplate(commandName, codeText);
        
        // Write the command file
        fs.writeFileSync(filePath, commandCode, 'utf8');
        
        // Clear require cache to enable immediate loading
        const resolvedPath = require.resolve(filePath);
        delete require.cache[resolvedPath];

        await sock.sendMessage(chatId, {
            text: `✅ *Command Installed Successfully!*

**Name:** ${commandName}
**File:** ${path.basename(filePath)}
**Size:** ${Buffer.byteLength(commandCode, 'utf8')} bytes

You can now use the command: \`.${commandName}\`

✨ *The command is immediately available for use!*`,
            ...channelInfo
        }, { quoted: message });

        // Log the installation
        if (global.addBotLog) {
            global.addBotLog('info', `Command ${filename} installed by ${global.pendingCommandInstall.senderId}`);
        }

        delete global.pendingCommandInstall;

    } catch (error) {
        console.error('Error installing command:', error);
        await sock.sendMessage(chatId, {
            text: `❌ Error installing command: ${error.message}`,
            ...channelInfo
        }, { quoted: message });
        delete global.pendingCommandInstall;
    }
}

module.exports = {
    cmdCommand,
    handleCommandInstallation
};