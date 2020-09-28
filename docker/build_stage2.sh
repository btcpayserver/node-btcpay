#!/usr/bin/env bash
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
TEMP=$1-temp
CONT=tempcont$(date +%s)

# Start up the temp image and wait for BTCPayServer to calm down, then shutdown
docker run --name $CONT $TEMP &
sleep 15
docker exec $CONT bash -c "kill \$(pgrep BTCPayServer)"
docker exec $CONT su postgres -c "/usr/lib/postgresql/11/bin/pg_ctl stop --pgdata=/pgsql/data -m f"
docker exec $CONT bash -c "kill \$(pgrep NBXplorer)"
docker exec $CONT bash -c "kill \$(pgrep node)"
docker exec $CONT bitcoin-cli -regtest stop

# New checkout (for testing)
# docker exec $CONT bash -c "cd /root/btcpayserver; \
#   git fetch origin; \
#   git checkout 79c70b3;"

# Replace login files
docker exec $CONT bash -c "sed -i 's/input asp-for=\"Email\"/input asp-for=\"Email\" value=\"test\@example.com\"/g' /root/btcpayserver/BTCPayServer/Views/Account/Login.cshtml"
docker exec $CONT bash -c "sed -i 's/input asp-for=\"Password\"/input asp-for=\"Password\" value=\"satoshinakamoto\"/g' /root/btcpayserver/BTCPayServer/Views/Account/Login.cshtml"
# Rebuild BTCPayServer
docker exec $CONT bash -c "cd /root/btcpayserver; DOTNET_CLI_TELEMETRY_OPTOUT=1 dotnet build -c Release BTCPayServer/BTCPayServer.csproj"
sleep 2
docker stop $CONT
docker commit $CONT $1