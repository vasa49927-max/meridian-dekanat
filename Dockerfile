# «Меридиан» — production-образ (Next.js standalone). Сборка и запуск на Amvera или любом Docker-хостинге.

FROM node:22-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

FROM node:22-bookworm-slim AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Фиктивный адрес БД только для этапа сборки (страницы динамические, к БД сборка не подключается).
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build NEXT_TELEMETRY_DISABLED=1
RUN npm run build && node scripts/check-bundle.mjs

FROM node:22-bookworm-slim AS run
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0 \
    TRUSTED_PROXY_HOPS=1
RUN useradd --system --uid 1001 meridian
COPY --from=build --chown=meridian /app/.next/standalone ./
COPY --from=build --chown=meridian /app/.next/static ./.next/static
COPY --from=build --chown=meridian /app/public ./public
COPY --from=build --chown=meridian /app/drizzle ./drizzle
COPY --from=build --chown=meridian /app/certs ./certs
USER meridian
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
# Миграции и первичное заполнение демо-данными выполняются при старте (src/instrumentation.ts).
CMD ["node", "server.js"]
