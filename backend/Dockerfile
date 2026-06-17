FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY prisma ./prisma
RUN npx prisma generate

COPY src ./src

RUN mkdir -p uploads/temp

EXPOSE 5000

CMD ["node", "src/app.js"]
