FROM node:latest

WORKDIR /usr/src/reddit-kafka-backend

COPY package*.json ./

COPY . .

RUN npm install kafkajs
RUN npm install
RUN npm install lodash
# RUN npm install --save pg sequelize sequelize-cli

# COPY . .

# EXPOSE 8000

CMD [ "npm", "run", "start" ]