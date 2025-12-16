#!/usr/bin/env bash
set -euo pipefail

# Config
# Customize these values for your environment
ACCOUNT_ID="your-account.testnet"   # NEAR testnet account to deploy to
NETWORK="testnet"                   # Network: mainnet|testnet
WASM_PATH="./res/{{crate_name}}.wasm" # Path to compiled WASM

# If res wasm not found, try target paths
if [ ! -f "$WASM_PATH" ]; then
  if [ -f "./target/wasm32-unknown-unknown/release/{{crate_name}}.wasm" ]; then
    WASM_PATH="./target/wasm32-unknown-unknown/release/{{crate_name}}.wasm"
  elif [ -f "./target/wasm32-unknown-unknown/debug/{{crate_name}}.wasm" ]; then
    WASM_PATH="./target/wasm32-unknown-unknown/debug/{{crate_name}}.wasm"
  fi
fi

echo "Deploying {{crate_name}} to $ACCOUNT_ID using $WASM_PATH on $NETWORK"

# near CLI deploy
# Login first if needed: near login --networkId $NETWORK
near deploy --accountId "$ACCOUNT_ID" --wasmFile "$WASM_PATH" --networkId "$NETWORK"

# Example calls
near view "$ACCOUNT_ID" get_greeting '{}' --networkId "$NETWORK"
near call "$ACCOUNT_ID" set_greeting '{"greeting":"Hello from Cursor"}' --accountId "$ACCOUNT_ID" --networkId "$NETWORK"
near view "$ACCOUNT_ID" get_greeting '{}' --networkId "$NETWORK"

echo "Deployed to $ACCOUNT_ID"

