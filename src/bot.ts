import TelegramBot from 'node-telegram-bot-api';
import GPTContextManager from './gpt/ContextManager';
import type Config from './config';

export default function init(config: typeof Config) {
  console.log('Initializing bot');
  const bot = new TelegramBot(config.telegram.key, { polling: true });

  console.log('Initializing context');
  const contextManager = new GPTContextManager(config.context, bot);

  bot.on('message', async (msg) => {
    if (!msg.text || msg.text.startsWith('/')) return;

    console.log('MESSAGE:', msg);
    const answer = await contextManager.process(msg);

    if (answer) bot.sendMessage(msg.chat.id, answer);
  });

  bot.setMyCommands([
    { command: 'clear', description: 'Clear context history' },
    { command: 'getprompt', description: 'Get current prompt' },
    { command: 'getinfo', description: 'Get bot info' },
    { command: 'setprompt', description: 'Set current prompt' },
    { command: 'setusername', description: 'Set the bot\'s username' },
    { command: 'setfirstname', description: 'Set the bot\'s first name' },
    { command: 'sethistorylength', description: 'Set the context history length' },
    { command: 'gethistory', description: 'Get the context history' },
  ]);

  bot.onText(/\/clear/, async (msg) => {
    contextManager.clearContextHistory(msg.chat);
    bot.sendMessage(msg.chat.id, 'Context history cleared');
  });

  bot.onText(/\/getprompt/, async (msg) => {
    const context = await contextManager.getContext(msg.chat);
    bot.sendMessage(msg.chat.id, `Current prompt:\n\n${context.prompt}`);
  });

  bot.onText(/\/getinfo/, async (msg) => {
    const context = await contextManager.getContext(msg.chat);
    bot.sendMessage(msg.chat.id, [
      `First name: ${context.authors[0].firstName}`,
      `Username: ${context.authors[0].username}`,
      `History maximum length: ${context.config.maxHistoryLength}`,
      '\nPrompt:',
      context.prompt,
    ].join('\n'));
  });

  bot.onText(/\/setprompt(?: (.+))?/, async (msg, match) => {
    if (!match[1]) {
      bot.sendMessage(msg.chat.id, 'Please specify a prompt: /setprompt <prompt>');
      return;
    }

    const context = await contextManager.getContext(msg.chat);
    const oldPrompt = context.prompt;
    context.prompt = match[1];
    contextManager.saveContext(msg.chat, context);

    bot.sendMessage(msg.chat.id, [
      'Old prompt:',
      oldPrompt,
      '\n',
      'New prompt:',
      context.prompt,
    ].join('\n'));
  });

  bot.onText(/\/setusername(?: (.+))?/, async (msg, match) => {
    if (!match[1]) {
      bot.sendMessage(msg.chat.id, 'Please specify a username: /setusername <username>');
      return;
    }

    const context = await contextManager.getContext(msg.chat);
    const oldUsername = context.authors[0].username;
    context.authors[0].username = match[1];
    contextManager.saveContext(msg.chat, context);
    bot.sendMessage(msg.chat.id, [
      `Old username: ${oldUsername}`,
      `New username: ${context.authors[0].username}`,
    ].join('\n'));
  });

  bot.onText(/\/setfirstname(?: (.+))?/, async (msg, match) => {
    if (!match[1]) {
      bot.sendMessage(msg.chat.id, 'Please specify a first name: /setfirstname <first name>');
      return;
    }

    const context = await contextManager.getContext(msg.chat);
    const oldFirstName = context.authors[0].firstName;
    context.authors[0].firstName = match[1];
    contextManager.saveContext(msg.chat, context);
    bot.sendMessage(msg.chat.id, [
      `Old first name: ${oldFirstName}`,
      `New first name: ${context.authors[0].firstName}`,
    ].join('\n'));
  });

  bot.onText(/\/sethistorylength(?: (.+))?/, async (msg, match) => {
    if (!match[1]) {
      bot.sendMessage(msg.chat.id, 'Please specify a history length: /sethistorylength <length>');
      return;
    }

    const context = await contextManager.getContext(msg.chat);
    const oldLength = context.config.maxHistoryLength;
    context.config.maxHistoryLength = parseInt(match[1], 10);
    contextManager.saveContext(msg.chat, context);
    bot.sendMessage(msg.chat.id, [
      `Old history length: ${oldLength}`,
      `New history length: ${context.config.maxHistoryLength}`,
    ].join('\n'));
  });

  bot.onText(/\/gethistory/, async (msg) => {
    const context = await contextManager.getContext(msg.chat);

    bot.sendMessage(msg.chat.id, [
      `Messages history:`,
      ...context.messages.map((message) => {
        const time = new Date(message.timestamp).toLocaleTimeString();
        const author = context.authors[message.authorId];
        const authorName = (author
          ? author.firstName || author.username
          : `User ${message.authorId}`
        );
        return `${time} ${authorName}: ${message.text}`;
      }),
      `\nHistory length: ${context.messages.length}`,
      `History maximum length: ${context.config.maxHistoryLength}`,
    ].join('\n'));
  });

  bot.on('polling_error', (err) => {
    console.error('Polling error:', err.message);
  });

  console.log('Bot initialized');
  return bot;
}
