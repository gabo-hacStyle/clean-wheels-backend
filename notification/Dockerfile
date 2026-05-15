FROM node:22-alpine AS base

WORKDIR /app

RUN apk add --no-cache libc6-compat

FROM base AS deps

COPY package*.json ./

RUN npm config set registry https://registry.npmjs.org
RUN npm config set fetch-retries 5
RUN npm config set fetch-retry-factor 2
RUN npm config set fetch-retry-maxtimeout 60000


RUN npm ci

FROM deps AS builder

COPY tsconfig*.json ./
COPY bin ./bin
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

EXPOSE 9020

CMD ["node", "dist/bin/www.js"]