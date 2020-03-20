FROM node:10

COPY package.json package.json
RUN npm install
RUN npm i -g mocha
# CMD mocha /mnt/test-scripts/test1.js
CMD mocha "/mnt/test-scripts/${TESTCASE}" --reporter mocha-multi-reporters --reporter-options configFile=mnt/config.json -p /mnt/results/goodmochahtml/myTestReport.html