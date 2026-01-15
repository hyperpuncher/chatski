FROM oven/bun:alpine
COPY . /app
WORKDIR /app

RUN bun i
RUN bun run build

EXPOSE 3000
CMD ["bun", "run", "start"]
