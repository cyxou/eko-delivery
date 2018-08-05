const neo4jService = require('./neo4j-service');
const Configstore  = require('configstore');
const pkg          = require('../package.json');
const chalk        = require('chalk');
const ora          = require('ora');
const outdent      = require('outdent');

const conf = new Configstore(pkg.name);

module.exports = {
  populateDb,
  clearDb,
  setConfig,
  calculateDeliveryCost,
  calculatePossibleDeliveryRoutes,
  calculateCheapestRoute
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
 * Handles clear database action
 *
 * @returns {undefined}
 */
async function clearDb() {
  const spinner = ora('Clearing DB...').start();

  try {

    await neo4jService.clearDb();

    spinner.succeed();
    console.log(chalk.green(outdent`
      Database cleared!
      You may populate it again if you want.`
    ));

  } catch(err) {
    spinner.fail();
    console.log(chalk.bold.red(`Error occured clearing DB: ${err.message}`));
    return handleError(err);
  }
}

function setConfig(args) {
  if (args.neo4jUri) conf.set('neo4j.uri', args.neo4jUri);
  if (args.neo4jUser) conf.set('neo4j.user', args.neo4jUser);
  if (args.neo4jPassword) conf.set('neo4j.password', args.neo4jPassword);
  if (args.dataFile) conf.set('dataFileName', args.dataFile);
}

/**
 * Handles the calculate delivery cost action
 *
 * @param {string} route Route representation in the following format: "A,B,C,D"
 * @returns {number} Cost of the route delivery
 */
async function calculateDeliveryCost(route, towns) {
  route = route.replace(/\s+/g, ',').split(',').reduce((acc, item) => {
    item !== '' && acc.push(item.trim());
    return acc;
  }, []);

  if (towns) route = [...route, ...towns];

  const prettyRoute = route.toString().replace(/,/g,'-');
  const spinner = ora(`Calculating delivery cost for the "${prettyRoute}" route...`).start();

  try {
    const res = await neo4jService.calculateDeliveryCost(route);
    spinner.succeed();

    if (Number.isNaN(parseInt(res, 10))) return console.log(chalk.yellow(res));

    console.log(chalk.magenta(outdent`
      "${prettyRoute}" delivery cost is ${chalk.bold.green(res)}`
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
async function calculatePossibleDeliveryRoutes(route, opts) {
  //console.log('opts: ', opts);
  const maxStops = opts.maxStops || -1;
  const costLessThen = opts.costLessThen || -1;

  const spinner = ora(
    `Calculating possible delivery routes between "${route[0]}" and "${route[1]}"` +
    (maxStops > -1 ? ` within maximum of ${maxStops} stop(s)` : ``) +
    (costLessThen > -1 ? ` with cost less than ${costLessThen}` : ``) + `...`
  ).start();

  try {
    const res = await neo4jService.calculatePossibleDeliveryRoutes(route, opts);

    spinner.succeed();

    if (Number.isNaN(parseInt(res, 10))) return console.log(chalk.yellow(res));

    console.log(chalk.magenta(outdent`
      ${chalk.bold.green(res)} possible route(s) found` +
      (maxStops > -1 ? ` within maximum of ${maxStops} stop(s)` : ``) +
      (costLessThen > -1 ? ` and cost less than ${costLessThen}` : ``)
    ));

  } catch(err) {
    spinner.fail();
    console.log(chalk.bold.red(
      `Error occured clculating possible delivery routes: ${err.message}`
    ));
    return handleError(err);
  }
}

/**
 * Handles the calculate the cheapest delivery route between two towns
 *
 * @param {string} from
 * @param {string} to
 * @returns {Promise}
 */
async function calculateCheapestRoute(from, to) {
  let route = [from, to];

  const spinner = ora(
    `Calculating the cheapest delivery route between "${from}" and "${to}"...`
  ).start();

  try {
    const res = await neo4jService.calculateCheapestRoute(route);

    spinner.succeed();

    if (Number.isNaN(parseInt(res, 10))) return console.log(chalk.yellow(res));

    console.log(chalk.magenta(outdent`
      The cheapest route costs ${chalk.bold.green(res)}`
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
