FROM node:16-buster

WORKDIR /opt/oracle

RUN apt-get update && \
    apt-get install -y libaio1 unzip wget
RUN wget https://download.oracle.com/otn_software/linux/instantclient/191000/instantclient-basic-linux.arm64-19.10.0.0.0dbru.zip && \
    unzip instantclient-basic-linux.arm64-19.10.0.0.0dbru.zip && \
    rm -f instantclient-basic-linux.arm64-19.10.0.0.0dbru.zip && \
    cd instantclient* && \
    rm -f *jdbc* *occi* *mysql* *jar uidrvci genezi adrci && \
    echo /opt/oracle/instantclient* > /etc/ld.so.conf.d/oracle-instantclient.conf && \
    ldconfig
    
WORKDIR /

COPY . .
COPY ./src/package.json ./src
EXPOSE 3000

WORKDIR /src
RUN npm install
RUN npm install -g nodemon
