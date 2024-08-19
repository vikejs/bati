#!/usr/bin/env bash

scriptDir=$(dirname -- "$(readlink -f -- "$BASH_SOURCE")")
tempD=$(mktemp -d)

cd $tempD

# Then run the following commands
# pnpm --loglevel=error create bati --react --tailwindcss --telefunc --hono
# cd my-app
# pnpm install
# pnpm run dev
terminalizer record $scriptDir/doc/demo -k -c $scriptDir/terminalizer-config.yml

# Then some manual edit is necessary

cd -

rm -fr $tempD
