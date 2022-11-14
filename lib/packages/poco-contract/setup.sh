#!/bin/bash

set -o errexit

echo "Copy contract abi to abi/"

mkdir -p abi
cp build/contracts/*.json abi/ --force

echo "Copy typescript type definetion to src/"
cp -r types/ethers-contracts/* src/ --force