interface MessageAuthor {
  id: number;
  isBot: boolean;
  firstName: string;
  username: string;
}

interface Message {
  id: number;
  timestamp: number;
  authorId: number;
  text: string;
}

type HistoryQueue = Message[];

interface Chat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title: string;
}

interface ContextJSON {
  chat: Chat;
  prompt: string;
  authors: { [id: number]: MessageAuthor };
  messages: HistoryQueue;
}

export default class Context {
  readonly chat: Chat;
  readonly prompt: string = '';
  readonly authors: { [id: number]: MessageAuthor } = {};
  readonly messages: HistoryQueue = [];

  constructor(chat: Chat, params?: ContextJSON) {
    this.chat = chat;
    if (!params) return;
    this.prompt = params.prompt;
    this.authors = params.authors;
    this.messages = params.messages;
  }

  addMessage(message: Message, author?: MessageAuthor) {
    this.messages.push(message);
    if (author) this.authors[author.id] = author;
  }

  shiftHistory(length: number) {
    while (this.messages.length > length) this.messages.shift();
    this.removeOldAuthors();
  }

  private removeOldAuthors() {
    for (const id in this.authors) {
      if (Number(id) === 0) continue; // Don't remove the bot (id = 0)
      if (this.messages.find((m) => m.authorId === Number(id))) continue;
      delete this.authors[id];
    }
  }

  private toJSON(): ContextJSON {
    return {
      chat: this.chat,
      prompt: this.prompt,
      authors: this.authors,
      messages: this.messages,
    };
  }

  toString() {
    return JSON.stringify(this.toJSON(), null, 2);
  }
}
