FROM node:20-alpine AS build
RUN npm install -g pnpm@10.25.0
# Headless Chromium for build-time prerender (puppeteer uses the system binary —
# its own download is skipped). Lives only in this build stage; the final nginx
# image copies just dist/, so Chromium never ships to production.
RUN apk add --no-cache chromium nss freetype harfbuzz ca-certificates ttf-freefont
ENV PUPPETEER_SKIP_DOWNLOAD=true \
    PRERENDER_CHROMIUM=/usr/bin/chromium-browser
WORKDIR /repo
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages packages
COPY apps/mobile/package.json apps/mobile/package.json
COPY apps/web apps/web
RUN pnpm install --frozen-lockfile --filter biblequiz-web...
RUN pnpm --filter biblequiz-web build
# Prerender public routes into dist/<route>/index.html (resilient: never fails the build).
RUN cd apps/web && node scripts/prerender.mjs

FROM nginx:alpine
COPY --from=build /repo/apps/web/dist /usr/share/nginx/html
COPY infra/docker/nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx","-g","daemon off;"]
