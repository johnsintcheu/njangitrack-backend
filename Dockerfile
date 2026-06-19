FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY node_modules ./node_modules
COPY . .

RUN npx nest build

EXPOSE 3004

CMD ["node", "dist/main.js"]