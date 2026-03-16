FROM node:20-bookworm-slim

WORKDIR /app

COPY ["Backend/Procurement Service/package.json", "./"]
RUN npm install --omit=dev

COPY ["Backend/Procurement Service/", "./"]

EXPOSE 4003

CMD ["node", "index.js"]
