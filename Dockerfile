FROM node:24-alpine
# Chromium sert à générer les lettres de motivation et les CV en PDF
RUN apk add --no-cache chromium font-noto
ENV CHROME_PATH=/usr/bin/chromium
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
