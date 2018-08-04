const neo4jService = require('./neo4j-service');
const chalk      = require('chalk');
const ora        = require('ora');
const outdent    = require('outdent');

module.exports = {
  populateDb,
  calculateDeliveryCost,
  calculatePossibleDeliveryRoutes
};

/**
 * Handles the populate database action
 *
 * @returns {undefined}
 */
async function populateDb() {
  const spinner = ora('Populating DB...').start();

  try {

    await neo4jService.populateDb();

    spinner.succeed();
    console.log(chalk.green(outdent`
      Database successfully populated!
      You may calculate your delivery now.`
    ));

  } catch(err) {
    spinner.fail();
    console.log(chalk.bold.red(`Error occured populating DB: ${err.message}`));
    return handleError(err);
  }
}

/**
 * Handles the calculate delivery cost action
 *
 * @param {string} route Route representation in the following format: "A,B,C,D"
 * @returns {number} Cost of the route delivery
 */
async function calculateDeliveryCost(route, towns) {
  route = route.split(',').map(item => item.trim());
  if (towns) route = [...route, ...towns];

  const spinner = ora(`Calculating delivery cost for the "${route}" route...`).start();

  try {
    const res = await neo4jService.calculateDeliveryCost(route);
    spinner.succeed();

    if (Number.isNaN(parseInt(res, 10))) return console.log(chalk.yellow(res));

    console.log(chalk.magenta(outdent`
      "${route}" delivery cost: ${chalk.bold.green(res)}`
    ));

  } catch(err) {
    spinner.fail();
    console.log(chalk.bold.red(
      `Error occured clculating delivery cost: ${err.message}`
    ));
    return handleError(err);
  }
}

/**
 * Handles the calculate possible delivery routes action
 *
 * @param {string} route Route representation in the following format: "A,B,C,D"
 * @returns {number} Cost of the route delivery
 */
async function calculatePossibleDeliveryRoutes(from, to,
  { maxStops = 0, routeReuse = true }
) {
  let route = [from, to];

  const spinner = ora(
    `Calculating possible delivery routes between "${from}" and "${to}"` +
    (maxStops ? ` within maximum of ${maxStops} stop(s)` : ``) + `...`
  ).start();

  try {
    const res = await neo4jService.calculatePossibleDeliveryRoutes(
      route, {maxStops, routeReuse}
    );

    spinner.succeed();

    if (Number.isNaN(parseInt(res, 10))) return console.log(chalk.yellow(res));

    console.log(chalk.magenta(outdent`
      ${chalk.bold.green(res)} possible route(s) found` +
      (maxStops ? ` within maximum of ${maxStops} stop(s)` : ``)
    ));

  } catch(err) {
    spinner.fail();
    console.log(chalk.bold.red(
      `Error occured clculating possible delivery routes: ${err.message}`
    ));
    return handleError(err);
  }
}

function handleError(err) {
  if (err.message.includes('ECONNREFUSED')) {
    console.log(chalk.red(outdent`
      Make sure that Neo4j server is up and running on the specified in config.js uri.`
    ));
  }

  if (err.message.includes('authentication')) {
    console.log(chalk.red(outdent`
      Make sure that Neo4j credentials specified in the config.js file are valid.
      You may also disable authentification providing "NEO4J_AUTH=none" as
      environment variable to Neo4j docker container.`
    ));
  }

  process.exit();
}
