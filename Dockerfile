# 개발 환경
  FROM node:23-alpine AS development

  WORKDIR /usr/src/app
  
  COPY package.json package-lock.json ./
  RUN npm install
  
  COPY . .
  
  CMD ["npm", "run", "start:dev"]
  
  
  # 배포 환경
  FROM node:23-alpine AS production
  
  WORKDIR /usr/src/app
  
  COPY package.json package-lock.json ./
  RUN npm install --production
  
  COPY . .
  
  RUN npm run build
  
  EXPOSE 3000
  
  CMD ["npm", "run", "start:prod"]
  