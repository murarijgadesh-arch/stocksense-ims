FROM node:22-alpine
WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
RUN npm ci

# Copy all source code
COPY . .

# Build frontend production bundle
RUN npm run build

# Expose server port
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start Express server with SQLite
CMD ["npm", "start"]
