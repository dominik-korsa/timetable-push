FROM node:18
WORKDIR /app
COPY package.json /tmp/package.json
RUN cd /tmp && npm install
COPY . /app
RUN mv /tmp/node_modules /app/
RUN npm run build
CMD ["npm", "run", "start"]

