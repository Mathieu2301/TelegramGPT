import fs from 'fs';
import Context from './Context';
import Prompt from './Prompt';
import createContextStorage from '../lib/contextstorage';
import type TelegramBot from 'node-telegram-bot-api';
import type Config from '../config';
import type { ContextJSON } from './Context';

const contextStorage = createContextStorage();

contextStorage.countContexts().then((count) => {
  console.log(`Found ${count} contexts using context storage: ${contextStorage.type}`);
});

export default class GPTContextManager {
  private readonly config: typeof Config.context;
  private readonly bot: TelegramBot;

  constructor(config: typeof Config.context, bot: TelegramBot) {
    this.config = config;
    this.bot = bot;
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
    const chatInfo = {
      id: chat.id,
      type: chat.type,
      title: chat.title,
    };

    const contextDoc = await this.loadContext(chat);
    const context = new Context(chatInfo, contextDoc);

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

  private static getContextId(chat: TelegramBot.Chat): string {
    return `${chat.type}${chat.id}`;
  }

  async loadContext(chat: TelegramBot.Chat): Promise<ContextJSON> {
    return contextStorage.loadContext(
      GPTContextManager.getContextId(chat),
    );
  }

  async saveContext(chat: TelegramBot.Chat, context: Context) {
    await contextStorage.saveContext(
      GPTContextManager.getContextId(chat),
      context.toJSON(),
    );
  }
}
