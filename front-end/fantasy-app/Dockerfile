# Base image
FROM node:12.7-alpine AS build
RUN mkdir -p /usr/src/app
RUN mkdir -p /usr/src/app/frontend
WORKDIR /usr/src/app/frontend
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build --prod

## Expose port to access server
EXPOSE 3000
# Command to run our app
CMD [ "node", "server.js" ]
