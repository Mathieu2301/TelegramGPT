# Telegram GPT

A Telegram bot that uses OpenAI's GPT-3 to generate messages based on the context of the conversation.

## Usage

1. Create a Telegram bot with [BotFather](https://t.me/botfather)
2. Create an OpenAI account and get an API key
3. Set your keys in the `.env` file or as environment variables
4. Start the bot
5. Send a message to the bot or add it to a group chat
6. type `/` to see the list of commands

## Development

1. Install dependencies

    ```sh
    yarn
    ```

2. Configuration

    Create a `.env` file or set env variables:

    ```properties
    TELEGRAM_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    OPENAI_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    # Optional:
    MONGO_URI=mongodb://localhost:27017
    MONGO_DB=telegram-gpt
    CONTEXT_HISTORY_MAX_LENGTH=10
    ```

3. Start the bot

    ```sh
    yarn start
    ```

## Deployment with Docker Compose

```yml
version: '3'

services:
  telegram-gpt:
    image: ghcr.io/mathieu2301/telegram-gpt:latest
    restart: always
    environment:
      TELEGRAM_KEY: ${TELEGRAM_KEY}
      OPENAI_KEY: ${OPENAI_KEY}
      # Optional:
      CONTEXT_HISTORY_MAX_LENGTH: 10
      # You can use MongoDB as a database, otherwise
      # the contexts will be stored in a folder.
      # Remove this if you don't want to use MongoDB.
      MONGO_URI: ${MONGO_URI}
      MONGO_DB: telegram-gpt

    # Remove this if you use MongoDB
    volumes:
      - contexts:/app/contexts

# Remove this if you use MongoDB
volumes:
  contexts:
```
