FROM node:lts-hydrogen

LABEL org.opencontainers.image.source=https://github.com/mathieu2301/telegramgpt

WORKDIR /app

COPY package.json .
RUN yarn
COPY . .
RUN yarn build
CMD ["node", "./dist/main.js"]
