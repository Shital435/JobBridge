FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm cache clean --force && npm install --no-audit --no-fund

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

EXPOSE 50054

CMD ["npm", "start"]