FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json* ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
EXPOSE 3000
# Reinstala deps al arrancar si package.json cambió (evita volumen node_modules obsoleto en dev)
CMD ["sh", "-c", "if [ -f package-lock.json ]; then npm ci; else npm install; fi && npm run dev -- --host 0.0.0.0 --port 3000"]
