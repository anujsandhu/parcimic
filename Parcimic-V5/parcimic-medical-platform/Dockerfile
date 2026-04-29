# Dockerfile for Google Cloud Run, Fly.io, Railway, etc.

FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY server.js ./
COPY .env.example ./.env

# Expose port (Cloud Run uses PORT env var)
EXPOSE 8080

# Set environment
ENV NODE_ENV=production
ENV PORT=8080

# Start server
CMD ["node", "server.js"]
