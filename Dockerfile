# Build Stage
FROM node:18 AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production
COPY package*.json ./
RUN npm install
COPY . .
# Вимикаємо перевірку лінтера під час білду для швидкості
RUN npm run build

# Runner Stage
FROM node:18-slim
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
COPY --from=builder /app ./
EXPOSE 3000
CMD ["npm", "start"]
