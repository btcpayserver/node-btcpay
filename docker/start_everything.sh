#!/usr/bin/env bash

# trap ctrl-c and call ctrl_c()
trap ctrl_c INT

function ctrl_c() {
  echo "** Trapped CTRL-C"
  exit 1
}

# Run regtest app for using regtest-client
/root/run_regtest_app.sh &
disown

# Run NBXplorer
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null && pwd )"
$DIR/start_nbx.sh &
disown

# Run postgres
chmod 777 /root
su postgres -c "/usr/lib/postgresql/11/bin/postgres -D /pgsql/data -h 0.0.0.0 -i" &
disown
sleep 5

# Run BTCPayServer
$DIR/start_btcpay.sh &
disown

sleep infinity
