# Build stage
FROM node:18-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# Production stage: serve bằng nginx
FROM nginx:alpine

# Copy build React sang thư mục nginx phục vụ
COPY --from=build /app/build /usr/share/nginx/html

# Copy file cấu hình Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 (nginx chạy mặc định trên 80)
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]