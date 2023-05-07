import type TelegramBot from 'node-telegram-bot-api';
import type Config from '../config';
import fs from 'fs';
import Context from './Context';
import Prompt from './Prompt';

export default class GPTContextManager {
  private readonly config: typeof Config.context;
  private readonly bot: TelegramBot;

  constructor(config: typeof Config.context, bot: TelegramBot) {
    this.config = config;
    this.bot = bot;
    if (!fs.existsSync('./contexts')) fs.mkdirSync('./contexts');
  }

  public async process(message: TelegramBot.Message): Promise<string> {
    const context = await GPTContextManager.getContext(message.chat, this.bot);

    context.addMessage({
      id: message.message_id,
      authorId: message.from.id,
      text: message.text || '',
      timestamp: Date.now(),
    }, {
      id: message.from.id,
      username: message.from.username,
      firstName: message.from.first_name,
      isBot: message.from.is_bot,
    });

    // Remove old messages
    context.shiftHistory(this.config.history.maxLength);

    if (Math.random() < 0.3) {
      GPTContextManager.saveContext(message.chat, context);
      return null;
    }

    this.bot.sendChatAction(message.chat.id, 'typing');

    const prompt = new Prompt(context);
    const answer = await prompt.genCompletion();

    context.addMessage({
      id: message.message_id + 1,
      authorId: 0,
      text: answer,
      timestamp: Date.now(),
    });

    GPTContextManager.saveContext(message.chat, context);

    return answer;
  }

  public async clearContextHistory(chat: TelegramBot.Chat) {
    const context = await GPTContextManager.getContext(chat, this.bot);
    context.shiftHistory(0);
    GPTContextManager.saveContext(chat, context);
  }

  static async getContext(chat: TelegramBot.Chat, bot: TelegramBot): Promise<Context> {
    const contextPath = GPTContextManager.getContextPath(chat);
    const chatInfo = {
      id: chat.id,
      type: chat.type,
      title: chat.title,
    };

    if (!fs.existsSync(contextPath)) {
      const newContext = new Context(chatInfo);
      const me = await bot.getMe();
      newContext.authors[0] = {
        id: 0,
        isBot: true,
        firstName: me.first_name,
        username: me.username,
      };
      return newContext;
    }

    const contextFile = fs.readFileSync(contextPath, 'utf-8');
    return new Context(chatInfo, JSON.parse(contextFile));
  }

  static getContextPath(chat: TelegramBot.Chat) {
    return `./contexts/${chat.type}${chat.id}.json`;
  }

  static saveContext(chat: TelegramBot.Chat, context: Context) {
    const contextPath = GPTContextManager.getContextPath(chat);
    fs.writeFileSync(contextPath, context.toString(), {
      encoding: 'utf-8',
    });
  }
}
