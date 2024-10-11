import { Command } from 'commander';
import {packageRun} from './commands/package.mjs'
import {startServer} from './commands/node.mjs'
import pkgJSON from '../../package.json' assert { type: 'json' };

const program = new Command();

program
  .name('ladder')
  .description('Ladder CLI tool for managing databases and packages')
  .version(pkgJSON.version);

// dbnode commands
const node = new Command('node')
  .description('Manage the database node');

node
  .command('start <name>')
  .description('Start the database node')
  .option('-p, --port <number>', 'Port to run the node on')
  .option('-d, --data-dir <path>', 'Directory to store databases')
  .action((name, options) => {
    // console.log('Starting the dbnode on port', name, options);
    startServer(name, options);
  });

node
  .command('stop')
  .description('Stop the database node')
  .action(() => {
    console.log('Stopping the dbnode');
  });

// package commands
const pkg = new Command('package')
  .description('Manage packages');

pkg
  .command('run <file>')
  .description('Run a local package file')
  .action(async (file) => {
    return await packageRun(file);
  });

pkg
  .command('publish')
  .description('Publish a package to the main node')
  .action(() => {
    console.log('Publishing the package');
  });

// Add subcommands
program.addCommand(node);
program.addCommand(pkg);

// Override default help behavior
program.showHelpAfterError(true); // Show help after unknown commands

// Add a custom full help command for all subcommands
program
  .command('help-all')
  .description('Show full help including all subcommands')
  .action(() => {
    console.log(program.helpInformation());
    console.log(dbnode.helpInformation());
    console.log(pkg.helpInformation());
  });

export default program;