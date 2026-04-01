FROM node:20-alpine AS builder

WORKDIR /app

RUN npm install -g pnpm

ENV CI=true

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY tsconfig.base.json ./
COPY package.json ./

COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/

COPY api-server/package.json ./api-server/
COPY api-server/tsconfig.json ./api-server/
COPY api-server/build.mjs ./api-server/

COPY ftth-calculator/package.json ./ftth-calculator/

RUN pnpm install --no-frozen-lockfile

COPY api-server/src ./api-server/src
COPY packages/db/src ./packages/db/src
COPY packages/api-zod/src ./packages/api-zod/src

RUN pnpm --filter @workspace/api-server build

FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

ENV CI=true
ENV NODE_ENV=production
ENV PORT=3000

COPY pnpm-workspace.yaml ./
COPY pnpm-lock.yaml ./
COPY .npmrc ./
COPY package.json ./

COPY packages/db/package.json ./packages/db/
COPY packages/api-zod/package.json ./packages/api-zod/
COPY packages/api-client-react/package.json ./packages/api-client-react/

COPY api-server/package.json ./api-server/

RUN pnpm install --prod --no-frozen-lockfile

COPY --from=builder /app/api-server/dist ./api-server/dist

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

CMD ["node", "api-server/dist/index.mjs"]
