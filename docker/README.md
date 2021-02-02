# Docker Image

## Build

```bash
cd ./docker
./build.sh btcpay-client-test-server
```

## OR Pull from docker hub

```bash
docker pull junderw/btcpay-client-test-server
```

## run on localhost then run tests

```bash
# If you built it
docker run -d -p 49392:49392 btcpay-client-test-server
# OR, if you pulled from docker hub
docker run -d -p 49392:49392 junderw/btcpay-client-test-server

# Wait 6 seconds before running the tests

# Install deps
npm install
# Run tests
npm test
```
