FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json README.md LICENSE ./
COPY bin ./bin
COPY src ./src
COPY catalog ./catalog
COPY skills ./skills
COPY plugins ./plugins
COPY types ./types
COPY assets ./assets
ENTRYPOINT ["node", "bin/modelpick.js", "mcp"]
