FROM registry.securityscorecard.io/nodejs:4.2.0
RUN apk add --no-cache make gcc g++ python curl

# Install yarn
# RUN apk add --no-cache yarn
RUN mkdir -p /opt
WORKDIR /opt
RUN curl -L https://yarnpkg.com/latest.tar.gz | tar -xz
RUN mv /opt/dist /opt/yarn
ENV PATH "$PATH:/opt/yarn/bin"

WORKDIR /usr/src/app

COPY package.json /usr/src/app
COPY yarn.lock /usr/src/app
RUN yarn

COPY . /usr/src/app/

ENTRYPOINT [ "./cucumber" ]
