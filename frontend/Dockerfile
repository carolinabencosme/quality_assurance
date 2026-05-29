FROM node:22-alpine
WORKDIR /app
RUN apk add --no-cache wget
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
EXPOSE 3000
CMD ["sh", "-c", "test -d node_modules/next || npm install; exec npm run dev"]
