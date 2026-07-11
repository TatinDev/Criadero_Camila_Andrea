FROM node:20-alpine

WORKDIR /app

COPY server.mjs package.json ./
COPY src/ ./src/
COPY components/ ./components/
COPY modules/ ./modules/
COPY index.html app.mjs api.mjs styles.css ./

RUN mkdir -p /data /data/uploads

ENV PORT=4177
ENV DATA_FILE=/data/criadero-db.json
ENV UPLOADS_DIR=/data/uploads
ENV NODE_ENV=production

EXPOSE 4177
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=3s --retries=3 \
  CMD wget -qO- http://127.0.0.1:4177/healthz || exit 1

CMD ["node", "server.mjs"]
