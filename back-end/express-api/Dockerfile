# Base image
FROM node:lts-alpine
# Set working directory so that all subsequent command runs in this folder
WORKDIR /usr/src/app
# Copy package json and install dependencies
COPY back-end/express-api/package*.json ./
RUN ls -l
RUN npm install
# Copy our app
COPY back-end/express-api .
RUN ls -l
# Expose port to access server
#EXPOSE 8080
# Command to run our app
CMD [ "npm", "start"]
