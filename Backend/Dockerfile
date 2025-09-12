FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

# CÀI CẢ devDependencies để có @babel/node
RUN npm ci

COPY . .

ENV NODE_ENV=development

EXPOSE 3000

CMD ["npm", "start"]
