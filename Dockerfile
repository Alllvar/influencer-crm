# ---------- Build: install everything, compile the API and bundle the client ----------
FROM node:22-alpine AS build
WORKDIR /app

# Dependency manifests first, so Docker caches `npm ci` until a package.json changes.
COPY package.json package-lock.json ./
COPY server/package.json server/
COPY client/package.json client/
RUN npm ci

COPY . .
RUN npm run build \
  && npm prune --omit=dev \
  && mkdir -p server/node_modules

# ---------- Runtime: only production dependencies and compiled output ----------
FROM node:22-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server/package.json ./server/
COPY --from=build /app/server/node_modules ./server/node_modules
COPY --from=build /app/server/dist ./server/dist
COPY --from=build /app/client/dist ./client/dist

USER node
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost:4000/api/health || exit 1
CMD ["node", "server/dist/server.js"]
