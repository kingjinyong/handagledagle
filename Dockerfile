# 빌드용 스테이지
FROM node:23-alpine AS build

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install

COPY . .

RUN npm run build

# ----

# 배포용 스테이지
FROM node:23-alpine AS production

WORKDIR /usr/src/app

COPY package.json package-lock.json ./
RUN npm install --production

COPY --from=build /usr/src/app/dist ./dist

COPY .env.production .env
COPY . .

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
