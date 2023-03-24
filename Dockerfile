FROM node:18-alpine As development

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

RUN apk --no-cache add --virtual .builds-deps build-base python3


RUN npm ci

RUN npm run build

FROM node:18-alpine as production


ARG NODE_ENV=production
ENV NODE_ENV=${NODE_ENV}

WORKDIR /usr/src/app

COPY package*.json ./

COPY . .

COPY --from=development /usr/src/app/dist ./dist
COPY --from=development /usr/src/app/node_modules ./node_modules

CMD ["node", "dist/src/main"]