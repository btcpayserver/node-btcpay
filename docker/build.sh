#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
TEMP=$1-temp
CONT=tempcont$(date +%s)

docker build $DIR -t $TEMP
docker run --name $CONT $TEMP &
sleep 120
docker exec $CONT bash -c "bitcoin-cli -regtest sendtoaddress \$(cat /root/btcpay.address.p2wpkh) 0.1337"
docker exec $CONT bash -c "bitcoin-cli -regtest sendtoaddress \$(cat /root/btcpay.address.p2shp2wpkh) 0.1337"
docker exec $CONT bash -c "bitcoin-cli -regtest generatetoaddress 6 mwhw4fySPWHZ4CUT1QHXWqAdE2wj9pJsa4"
sleep 20
docker exec $CONT bash -c "kill \$(pgrep BTCPayServer)"
docker exec $CONT su postgres -c "/usr/lib/postgresql/11/bin/pg_ctl stop --pgdata=/pgsql/data -m f"
docker exec $CONT bash -c "kill \$(pgrep NBXplorer)"
docker exec $CONT bash -c "kill \$(pgrep node)"
docker exec $CONT bitcoin-cli -regtest stop
docker exec $CONT bash -c "sed -i 's/\/usr\/bin\/bitcoin-cli -regtest generatetoaddress 432 mwhw4fySPWHZ4CUT1QHXWqAdE2wj9pJsa4//g' /root/run_bitcoind_service.sh"
docker exec $CONT bash -c "sed -i 's/sleep 2//g' /root/run_bitcoind_service.sh"
docker exec $CONT bash -c "sed -i 's/\/cookie/\/tokens/g' /root/stopAndCookie/stopAndCookie.js"
docker exec $CONT bash -c "sed -i 's/\/datadir\/RegTest\/.cookie/\/root\/btcpaytokens/g' /root/stopAndCookie/stopAndCookie.js"
docker exec $CONT bash -c "sed -i 's/sleep infinity/node \/root\/stopAndCookie\/stopAndCookie.js \&\nsleep infinity/g' /root/start_everything.sh"

# New checkout (for testing)
# docker exec $CONT bash -c "cd /root/btcpayserver; \
#   git fetch origin; \
#   git checkout a5df029;"

# Replace login files
docker exec $CONT bash -c "sed -i 's/placeholder=\"Email\"/placeholder=\"Email\" value=\"test\@example.com\"/g' /root/btcpayserver/BTCPayServer/Views/Account/Login.cshtml"
docker exec $CONT bash -c "sed -i 's/placeholder=\"Password\"/placeholder=\"Password\" value=\"satoshinakamoto\"/g' /root/btcpayserver/BTCPayServer/Views/Account/Login.cshtml"
# Rebuild BTCPayServer
docker exec $CONT bash -c "cd /root/btcpayserver; DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet build -c Release BTCPayServer/BTCPayServer.csproj"
sleep 10
docker stop $CONT
docker commit $CONT $1
