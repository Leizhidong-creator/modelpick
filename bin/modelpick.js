#!/usr/bin/env node
import { main } from '../src/cli/main.js';

main(process.argv.slice(2)).catch((error) => {
  console.error(error?.stack ?? error);
  process.exit(1);
});
