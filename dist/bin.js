#!/usr/bin/env node
import { buildCLI } from './cli.js';
const cli = buildCLI();
cli.parse(process.argv.slice(2));
//# sourceMappingURL=bin.js.map