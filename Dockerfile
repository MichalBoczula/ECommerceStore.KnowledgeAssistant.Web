FROM node:24-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine
COPY --from=build /app/dist/knowledge-assistant/browser /usr/share/nginx/html
COPY nginx/default.conf.template /etc/nginx/templates/default.conf.template
ENV KNOWLEDGE_API_URL=http://knowledge-api:8080
ENV KNOWLEDGE_API_KEY=""
EXPOSE 8080
