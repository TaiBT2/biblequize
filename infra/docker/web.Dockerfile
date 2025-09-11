FROM node:20-alpine AS build
WORKDIR /app
COPY apps/web /app
RUN npm ci || npm i
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx","-g","daemon off;"]

