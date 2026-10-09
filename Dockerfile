FROM node:22-alpine AS build

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:stable-alpine
RUN apk add --no-cache python3
COPY --from=build /app/dist /usr/share/nginx/html
COPY --from=build /app/health-manifest.json /app/health-manifest.json
COPY healthcheck.py /app/healthcheck.py

HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD ["python3", "/app/healthcheck.py"]

EXPOSE 80
