import { Command } from 'commander';
const program = new Command();

program
  .name('ladder')
  .description('Ladder CLI tool for managing databases and packages')
  .version('1.0.0');

// dbnode commands
const dbnode = new Command('dbnode')
  .description('Manage the database node');

dbnode
  .command('start')
  .description('Start the database node')
  .option('-p, --port <number>', 'Port to run the node on')
  .option('-d, --datadir <path>', 'Directory to store databases')
  .action((options) => {
    console.log('Starting the dbnode on port', options.port);
  });

dbnode
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
  .action((file) => {
    console.log('Running package from file', file);
  });

pkg
  .command('publish')
  .description('Publish a package to the main node')
  .action(() => {
    console.log('Publishing the package');
  });

// Add subcommands
program.addCommand(dbnode);
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