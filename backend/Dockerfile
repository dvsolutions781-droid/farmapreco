FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY src/ ./src/
COPY data/ ./data/
EXPOSE 3001
CMD ["node", "src/server.js"]
