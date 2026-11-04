FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json .npmrc ./

RUN npm config set registry https://registry.npmjs.org/ \
    && npm config set fetch-retries 5 \
    && npm config set fetch-retry-factor 2 \
    && npm config set fetch-retry-mintimeout 10000 \
    && npm config set fetch-retry-maxtimeout 120000 \
    && npm ci --omit=dev --no-audit --no-fund

COPY . .

RUN npm run check \
    && mkdir -p /app/.sessions /app/uploads /data \
    && for file in home.html home.js login.html login.js index.html script.js admin.html admin.js support.html support.js style.css mobile.css system.css smart-tools.css v10-experience.css v10-polish.css bubble-effects.css app-runtime.js smart-tools.js v10-experience.js v10-polish.js i18n.js admin-i18n.js ui.js sw.js site.webmanifest nexchat-logo.svg admin-nebula.jpg server.js store.seed.json; do test -f "/app/$file"; done \
    && chown -R node:node /app /data

ENV NODE_ENV=production \
    DATA_DIR=/data \
    PORT=3000
EXPOSE 3000
USER node

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/health >/dev/null || exit 1

CMD ["npm", "start"]
