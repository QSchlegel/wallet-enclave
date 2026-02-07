# Lightweight runtime image
FROM node:22-alpine
WORKDIR /app

# Install deps (prod only)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy build output
COPY dist ./dist

ENV WALLET_ENCLAVE_HOST=0.0.0.0
ENV WALLET_ENCLAVE_PORT=3377
EXPOSE 3377

CMD ["node", "dist/server.js"]
