FROM node:12.18.3
RUN apt-get update && apt-get install -y openjdk-8-jdk

WORKDIR /Users/shin-yeopoh/workspace/dockerapp

COPY package*.json .

ENV NODE_ENV production

ENV DEVIAN_FRONTEND=noninteractive

RUN npm install

EXPOSE 8084

CMD ["npm","start"]

COPY . .