# Optional: run the sample in Docker (no local Node required).
#   docker build -t appspike-web-sample .
#   docker run --rm -p 4173:4173 appspike-web-sample
# Then open http://localhost:4173 and press Initialize. Set your API key in
# src/apiKey.ts before building — it is baked into the bundle at build time.
FROM node:22-bookworm-slim

# git is needed because the SDK installs from a git tag (github:pydetech/...)
RUN apt-get update \
    && apt-get install -y --no-install-recommends git ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY package.json ./
RUN npm install

COPY tsconfig.json index.html ./
COPY src ./src
RUN npm run build

EXPOSE 4173
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0"]
