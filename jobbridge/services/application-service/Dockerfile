FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY tsconfig.json ./
COPY src ./src
COPY proto ./proto
RUN npm run build
CMD ["npm","start"]
