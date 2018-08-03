#!/usr/bin/env node

const program = require('commander');
const chalk   = require('chalk');
const actions = require('./cli-actions');

program
  .version('1.0.0')
  .description('Eko Delivery Service');

program
  .command('populate-db')
  .description('Populate Neo4j DB with routes data from the ./neo4j/import/data.csv file')
  .action(actions.populateDb);

program.parse(process.argv);

process.on('unhandledRejection', err => {
  console.log(chalk.bold.red(`unhandledRejection: ${err.message}`));
});

process.on('uncaughtException', err => {
  console.error(chalk.bold.red(`uncaughtException: ${err.message}`));
});
