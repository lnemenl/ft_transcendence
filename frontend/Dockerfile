# Stage 1: Frontend builder
FROM node:lts-slim AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npm run build

# Stage 2: Nginx 
FROM nginx:1.27-alpine

RUN apk update && apk add --no-cache openssl

WORKDIR /usr/share/nginx/html

RUN rm -fr ./*

COPY --from=builder /app/dist .

RUN mkdir -p game

COPY nginx.conf /etc/nginx/nginx.conf

RUN mkdir -p /etc/nginx/certs

RUN openssl req -x509 -new -nodes \
    -out /etc/nginx/certs/cert.pem \
    -keyout /etc/nginx/certs/key.pem \
    -subj "/C=FI/ST=Uusimaa/L=Helsinki/CN=localhost" \
    -outform PEM

EXPOSE 443

CMD ["nginx", "-c", "/etc/nginx/nginx.conf", "-g", "daemon off;"]