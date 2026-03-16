FROM node:20-bookworm-slim

WORKDIR /app

COPY ["Backend/Auth Service/package.json", "./"]
RUN npm install --omit=dev

COPY ["Backend/Auth Service/", "./"]

EXPOSE 4001

CMD ["node", "index.js"]
