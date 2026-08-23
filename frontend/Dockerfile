FROM node:22-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 4200

CMD ["sh", "-c", "npm run start -- --host 0.0.0.0 --port 4200"]
