#!/usr/bin/env bash

cd /root/btcpayserver

export BTCPAY_POSTGRES="User ID=postgres;Host=127.0.0.1;Port=5432;Database=btcpayserverregtest"
export BTCPAY_NETWORK=regtest
export BTCPAY_BIND=0.0.0.0:49392
export BTCPAY_ROOTPATH=/
export BTCPAY_CHAINS=btc
export BTCPAY_BTCEXPLORERURL=http://127.0.0.1:23828
export BTCPAY_BTCEXPLORERCOOKIEFILE=/datadir/RegTest/.cookie

# Run NBXplorer
dotnet run --no-launch-profile --no-build -c Release -p "BTCPayServer/BTCPayServer.csproj" -- $@
