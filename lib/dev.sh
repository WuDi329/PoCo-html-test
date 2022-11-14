#!/bin/bash

set -o errexit

# Ganache

pnpm run --filter "@poco/contract" ganache &

# Migrate

pnpm run --filter "@poco/contract" remigrate

# Watch Library

pnpm --stream -r run watch &

# Serve

pnpm --stream -r run serve &