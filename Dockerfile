FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN npx prisma generate
RUN npx nest build

EXPOSE 3001

CMD ["node", "dist/main.js"]