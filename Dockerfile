FROM node:lts-hydrogen

WORKDIR /app

COPY package.json .
RUN yarn
COPY . .
RUN yarn build
CMD ["node", "./dist/main.js"]
