FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

FROM base AS deps

COPY package*.json ./

RUN npm ci

FROM deps AS builder

COPY tsconfig*.json ./
COPY src ./src

RUN npm run build

FROM base AS prod-deps

COPY package*.json ./

RUN npm ci --omit=dev && npm cache clean --force

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nodeuser -G nodejs

COPY --from=prod-deps /app/node_modules ./node_modules

COPY --from=builder /app/dist ./dist

COPY package*.json ./

RUN chown -R nodeuser:nodejs /app

USER nodeuser

EXPOSE 9000

CMD ["node", "dist/index.js"]