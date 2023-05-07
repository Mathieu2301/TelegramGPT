import openai from '../lib/openai';
import type Context from './Context';

export default class Prompt {
  context: Context;

  constructor(context: Context) {
    this.context = context;
  }

  async genCompletion(): Promise<string> {
    const fullPrompt = Prompt.contextToPrompt(this.context);

    const completion = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: fullPrompt,
      max_tokens: 400,
      stop: ['\n'],
    });

    console.log(
      'PROMPT:', fullPrompt,
      'COMPLETION:', completion.data.choices,
    );

    return completion.data.choices[0].text;
  }

  static formatDate(date: Date): string {
    return date.toLocaleTimeString();
  }

  static contextToPrompt(context: Context): string {
    const lines: string[] = [];

    lines.push(context.chat.title);
    lines.push('\n---\n');
    lines.push(context.prompt);
    lines.push('\n---\n');

    for (const message of context.messages) {
      const author = context.authors[message.authorId];
      const authorName = (author
        ? author.firstName || author.username
        : `User ${message.authorId}`
      );
      const time = Prompt.formatDate(new Date(message.timestamp));
      const text = message.text.replace(/\n/g, ' ');
      lines.push(`${time} ${authorName}: ${text}\n`);
    }
    

    const botAuthor = context.authors[0];
    const botName = botAuthor.firstName || botAuthor.username || 'TelegramGPT (Me)';
    const time = Prompt.formatDate(new Date());
    lines.push(`${time} ${botName}: `);

    return lines.join('\n');
  }
}
