FROM node:22-alpine
WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY server.js ./
COPY public ./public

RUN mkdir -p /app/data

ENV HOST=0.0.0.0
ENV PORT=3000
ENV BASE_PATH=/konkursy/krasota-bozhego-mira

EXPOSE 3000
VOLUME ["/app/data"]

CMD ["node", "server.js"]
