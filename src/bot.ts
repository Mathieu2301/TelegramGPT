import TelegramBot from 'node-telegram-bot-api';
import GPTContextManager from './gpt/ContextManager';
import type Config from './config';

export default function init(config: typeof Config) {
  console.log('Initializing bot');
  const bot = new TelegramBot(config.telegram.key, { polling: true });

  console.log('Initializing context');
  const contextManager = new GPTContextManager(config.context, bot);

  bot.on('message', async (msg) => {
    if (!msg.text) return;

    if (msg.text === '/clear') {
      contextManager.clearContextHistory(msg.chat);
      bot.sendMessage(msg.chat.id, 'Context history cleared');
      return;
    }

    console.log('MESSAGE:', msg);
    const answer = await contextManager.process(msg);

    if (answer) bot.sendMessage(msg.chat.id, answer);
  });
}
