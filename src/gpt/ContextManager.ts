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
    const context = await this.getContext(message.chat);

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
    context.shiftHistory();

    // if (Math.random() < 0.3) {
    //   this.saveContext(message.chat, context);
    //   return null;
    // }

    this.bot.sendChatAction(message.chat.id, 'typing');

    const prompt = new Prompt(context);
    const answer = await prompt.genCompletion();

    if (!answer) {
      this.saveContext(message.chat, context);
      return null;
    }

    context.addMessage({
      id: message.message_id + 1,
      authorId: 0,
      text: answer,
      timestamp: Date.now(),
    });

    this.saveContext(message.chat, context);

    return answer;
  }

  public async clearContextHistory(chat: TelegramBot.Chat) {
    const context = await this.getContext(chat);
    context.clearHistory();
    this.saveContext(chat, context);
  }

  async getContext(chat: TelegramBot.Chat): Promise<Context> {
    const contextPath = GPTContextManager.getContextPath(chat);
    const chatInfo = {
      id: chat.id,
      type: chat.type,
      title: chat.title,
    };

    if (!fs.existsSync(contextPath)) {
      const newContext = new Context(chatInfo);
      const me = await this.bot.getMe();
      newContext.config.maxHistoryLength = this.config.history.defaultMaxLength;
      newContext.authors[0] = {
        id: 0,
        isBot: true,
        firstName: me.first_name,
        username: me.username,
      };
      return newContext;
    }

    const contextFile = fs.readFileSync(contextPath, 'utf-8');
    const context = new Context(chatInfo, JSON.parse(contextFile));

    if (!context.authors[0]) {
      const me = await this.bot.getMe();
      context.authors[0] = {
        id: 0,
        isBot: true,
        firstName: me.first_name,
        username: me.username,
      };
    }

    if (!context.config || !context.config.maxHistoryLength) {
      context.config.maxHistoryLength = this.config.history.defaultMaxLength;
    }

    return context;
  }

  private static getContextPath(chat: TelegramBot.Chat) {
    return `./contexts/${chat.type}${chat.id}.json`;
  }

  saveContext(chat: TelegramBot.Chat, context: Context) {
    const contextPath = GPTContextManager.getContextPath(chat);
    fs.writeFileSync(contextPath, context.toString(), {
      encoding: 'utf-8',
    });
  }
}
