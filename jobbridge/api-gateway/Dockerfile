FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src
COPY proto ./proto

RUN npm run build

EXPOSE 4000

CMD ["npm", "start"]