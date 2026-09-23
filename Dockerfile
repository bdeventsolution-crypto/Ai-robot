FROM node:20-alpine
WORKDIR /app
COPY . .
EXPOSE 7777
ENV PORT=7777
CMD ["node", "server.js"]
