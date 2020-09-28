FROM junderw/nbxplorer-client-test-server
MAINTAINER Jonathan Underwood

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /root

# Install postgres
RUN echo "deb http://apt.postgresql.org/pub/repos/apt/ bionic-pgdg main" >> /etc/apt/sources.list.d/pgdg.list
RUN curl https://www.postgresql.org/media/keys/ACCC4CF8.asc | apt-key add -
RUN apt update && \
  apt install -y \
  postgresql-11 \
  dotnet-sdk-3.1

RUN mkdir -p /pgsql/data
RUN chmod 700 /pgsql/data && \
  chown postgres:postgres /pgsql/data

RUN su postgres -c "\
cd /pgsql/data; \
/usr/lib/postgresql/11/bin/pg_ctl initdb --pgdata=/pgsql/data; \
/usr/lib/postgresql/11/bin/postgres -D /pgsql/data -h 0.0.0.0 -i & \
sleep 5; \
psql -h 127.0.0.1 -c \"CREATE DATABASE btcpayserverregtest;\"; \
sleep 3; \
/usr/lib/postgresql/11/bin/pg_ctl stop --pgdata=/pgsql/data -m f"

# Install BTCPayServer
RUN git clone https://github.com/btcpayserver/btcpayserver.git && \
  cd btcpayserver/ && \
  git checkout 80e46db && \
  DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet build -c Release BTCPayServer/BTCPayServer.csproj

# Re-install NBXplorer because I'm an idiot
RUN cd NBXplorer/ && \
  git fetch origin && \
  git checkout ce2f21f && \
  DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet build -c Release NBXplorer/NBXplorer.csproj

RUN sed -i 's/generate 432/generatetoaddress 432 \$\(bitcoin-cli -regtest getnewaddress\)/g' /root/run_bitcoind_service.sh

RUN apt install -y \
  libx11-6 libx11-xcb1 libxcb1 libxcb-dri3-0 libxcomposite1 \
  libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 \
  libxss1 libdrm2 libxrandr2 libgbm1 libasound2 libatk1.0-0 \
  libatk-bridge2.0-0 libpangocairo-1.0-0 libgtk-3-0

COPY \
  start_everything.sh \
  start_btcpay.sh \
  ./
RUN chmod +x start_everything.sh && \
  chmod +x start_btcpay.sh

RUN mkdir -p /root/registerAdmin && \
  cd /root/registerAdmin && \
  npm init -y && \
  npm install puppeteer@3.0.1 btcpay@0.2.4
COPY \
  registerAdmin.js \
  ./registerAdmin

RUN /root/start_everything.sh >/dev/null 2>&1 & \
  sleep 20 && \
  BTCPAY_IGNORE_SANDBOX_ERROR=1 node /root/registerAdmin/registerAdmin.js

RUN apt-get purge -y \
  libx11-6 libx11-xcb1 libxcb1 libxcb-dri3-0 libxcomposite1 \
  libxcursor1 libxdamage1 libxi6 libxtst6 libnss3 libcups2 \
  libxss1 libdrm2 libxrandr2 libgbm1 libasound2 libatk1.0-0 \
  libatk-bridge2.0-0 libpangocairo-1.0-0 libgtk-3-0 && \
  apt-get autoremove -y && \
  rm -rf /root/registerAdmin

ENTRYPOINT ["/root/start_everything.sh"]

EXPOSE 18271
EXPOSE 23828
EXPOSE 49392
EXPOSE 8080
