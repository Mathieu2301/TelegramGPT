import dotenv from 'dotenv';

dotenv.config();

const required = [
  'OPENAI_KEY',
  'TELEGRAM_KEY',
];

const missing = required.filter((key) => !process.env[key]);
for (const key of missing) console.error(`${key} is not defined`);
if (missing.length) process.exit(1);

export default {
  telegram: {
    key: process.env.TELEGRAM_KEY,
  },
  openai: {
    key: process.env.OPENAI_KEY,
  },
  context: {
    history: {
      maxLength: Number(process.env.CONTEXT_HISTORY_MAX_LENGTH || 10),
    },
  },
};
