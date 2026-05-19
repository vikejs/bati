FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && npm i -g @antfu/ni

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* bun.lock* ./
RUN ni --frozen

COPY . .
RUN nr build


FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

RUN corepack enable && npm i -g @antfu/ni

COPY package.json package-lock.json* yarn.lock* pnpm-lock.yaml* bun.lock* ./
RUN ni -P --frozen && npm uninstall -g @antfu/ni

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "./dist/server/index.mjs"]