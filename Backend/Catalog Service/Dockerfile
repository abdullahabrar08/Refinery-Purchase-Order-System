FROM node:20-bookworm-slim

WORKDIR /app

COPY ["Backend/Catalog Service/package.json", "./"]
RUN npm install --omit=dev

COPY ["Backend/Catalog Service/", "./"]
COPY ["refinery_items_50_5suppliers_strict.json", "/refinery_items_50_5suppliers_strict.json"]

EXPOSE 4002

CMD ["node", "index.js"]
