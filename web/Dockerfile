FROM node:22-alpine

ARG DATABASE_URL=postgresql://postgres:postgres@db:5432/criadero_camila_andrea
ENV DATABASE_URL=$DATABASE_URL

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY prisma/ ./prisma/
COPY prisma.config.ts ./
RUN npx prisma generate

COPY server.mjs server-prisma.mjs ./
COPY src/ ./src/
COPY frontend/ ./frontend/
COPY components/ ./components/
COPY modules/ ./modules/
COPY index.html app.mjs api.mjs styles.css ./

RUN mkdir -p /data /data/uploads && chown -R node:node /app /data

ENV PORT=4177
ENV NODE_ENV=production
ENV DATA_FILE=/data/criadero-db.json
ENV UPLOADS_DIR=/data/uploads
ENV JWT_SECRET=criadero-jwt-production-secret
ENV SERVER_MODE=prisma

USER node

EXPOSE 4177
VOLUME ["/data"]

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:4177/healthz',r=>{process.exit(r.statusCode===200?0:1)})"

CMD ["sh", "-c", "npx prisma db push; node prisma/seed.mjs; node server-prisma.mjs"]
