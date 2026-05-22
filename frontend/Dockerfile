FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
# Instala deps solo si el volumen node_modules está vacío (primera vez ~1 min)
CMD ["sh", "-c", "test -d node_modules/react-router-dom || npm ci; exec npm run dev -- --host 0.0.0.0 --port 3000"]
