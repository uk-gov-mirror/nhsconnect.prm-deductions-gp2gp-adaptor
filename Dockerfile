FROM node:12-alpine
WORKDIR /app
COPY package*.json ./
COPY build/ /app/

RUN apk update && apk add openssl ca-certificates git && rm -rf /var/cache/apk/*
COPY ./certs/deductions.crt /usr/local/share/ca-certificates/deductions.crt
RUN update-ca-certificates

ENV NODE_EXTRA_CA_CERTS=/usr/local/share/ca-certificates/deductions.crt

EXPOSE 3000
RUN apk add --no-cache tini bash

COPY run-server.sh /usr/bin/run-gp2gp-server

ENV GP2GP_ADAPTOR_REPOSITORY_ASID=deduction-asid \
  GP2GP_ADAPTOR_REPOSITORY_ODS_CODE=deduction-ods \
  NHS_ENVIRONMENT=local \
  GP2GP_ADAPTOR_MHS_OUTBOUND_URL="" \
  GP2GP_ADAPTOR_MHS_ROUTE_URL="" \
  GP2GP_ADAPTOR_AUTHORIZATION_KEYS="auth-key-1"

RUN npm install

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["/usr/bin/run-gp2gp-server"]
