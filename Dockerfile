FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Пропускаємо білд, запускаємо в режимі розробки для економії пам'яті
EXPOSE 3000
CMD ["npm", "run", "dev"]
