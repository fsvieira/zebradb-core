#!/usr/bin/env node

import { Command } from 'commander';
import startNode from '../modules/node/ladderNode.mjs'; // Adjust the path
import pkg from '../package.json' assert { type: 'json' };

const program = new Command();

program
  .name('ladderNode')
  .description('Start the Ladder Node server')
  .version(pkg.version)
  .option('-n, --name <string>', 'A name for the node')
  .option('-p, --port <number>', 'Port to run the node on', 8080) // Default port 8080 if not specified
  .option('-d, --data-dir <path>', 'Directory to store databases', './dbs') // Default data directory if not specified
  .action((options) => {
    // Start the server with the provided options
    const { name,  port, dataDir } = options;
    startNode(name, port, dataDir);
  });

// Parse the command-line arguments
program.parse(process.argv);
