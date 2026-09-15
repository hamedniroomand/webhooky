# syntax=docker/dockerfile:1

FROM oven/bun:latest AS base
WORKDIR /app

ENV NODE_ENV=production
ENV HUSKY=0
ENV HOST=0.0.0.0
ENV PORT=3000
ENV WEBHOOKY_DB_PATH=/data/webhooky.sqlite

FROM base AS install
COPY package.json bun.lock bunfig.toml ./
RUN bun ci

FROM base AS release
COPY --from=install /app/node_modules ./node_modules
COPY package.json bun.lock bunfig.toml tsconfig.json ./
COPY src ./src
COPY styles ./styles
COPY components.json ./

RUN mkdir -p /data && chown -R bun:bun /app /data
USER bun

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD bun -e "fetch('http://127.0.0.1:3000/api/session').then((r)=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["bun", "src/index.ts"]
