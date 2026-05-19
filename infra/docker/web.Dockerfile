FROM node:20-alpine AS build
RUN npm install -g pnpm@10.25.0
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web apps/web
RUN pnpm install --frozen-lockfile --filter biblequiz-web...
RUN pnpm --filter biblequiz-web build

FROM nginx:alpine
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
