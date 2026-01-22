#!/bin/bash
# Use environment variables if set, otherwise default
NETWORK=${NEAR_NETWORK:-testnet}
ACCOUNT=${ACCOUNT_ID:-dev-account.testnet}

echo "Deploying to $NETWORK using account $ACCOUNT"
# In a real scenario, this would call near-cli
# near deploy $ACCOUNT target/wasm32-unknown-unknown/release/basic_contract.wasm
echo "Simulated deploy success"
echo "Transaction Id: 6zgh2u9jfq5s1k8"
