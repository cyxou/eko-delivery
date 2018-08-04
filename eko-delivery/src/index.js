#!/usr/bin/env node

const program   = require('commander');
const chalk     = require('chalk');
const inquirer  = require('inquirer');
const actions   = require('./cli-actions');
const questions = require('./questions');

program
  .version('1.0.0', '-v, --version')
  .description('Eko Delivery Service');

program
  .command('populate-db')
  .description('Populate Neo4j DB with routes data from the ./neo4j/import/data.csv file')
  .action(actions.populateDb);

program
  .command('get-delivery-cost <route> [towns...]')
  .description('Calculate the delivery cost of the given delivery route.')
  .usage('<route> [towns...]')
  .action(actions.calculateDeliveryCost);

program
  .command('get-possible-routes <from> <to>')
  .option('--max-stops <val>', 'Maximum stops on the route', validateInt)
  .option('--no-route-reuse', 'Do not allow to use the same route twice')
  .description('Calculate the number of possible delivery routes between two towns')
  .action(actions.calculatePossibleDeliveryRoutes);

program
  .command('get-cheapest-route <from> <to>')
  .description('Calculate the cheapest delivery route between two towns')
  .usage('<from> <to>')
  .action(actions.calculateCheapestRoute);

program.parse(process.argv);

// If user hasn't provided any input to the cli, than use inquirer to help him
// decide what to do.
if (!process.argv.slice(2).length) {
  startInteractiveMode();
}

process.on('unhandledRejection', err => {
  console.log(chalk.bold.red(`unhandledRejection: ${err.message}`));
});

process.on('uncaughtException', err => {
  console.error(chalk.bold.red(`uncaughtException: ${err.message}`));
});

async function startInteractiveMode() {
  const answers = await inquirer.prompt(questions);

  switch (answers.action) {
    case 'calculateDeliveryCost':
      return actions[answers.action](answers.route);

    case 'calculatePossibleDeliveryRoutes':
      return actions[answers.action](answers.route[0], answers.route[1], {
        maxStops: answers.maxStops,
        routeReuse: answers.routeReuse
      });

    case 'calculateCheapestRoute':
      return actions[answers.action](answers.route[0], answers.route[1]);
  }
}

function validateInt(x) {
  if (isInteger(parseInt(x, 10))) return x;
  console.error(chalk.red('error: --max-stops option expects integer value'));
  process.exit();
}
function isInteger(x) { return (x ^ 0) === x; }
