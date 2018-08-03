const controller = require('./neo4j-service');
const chalk      = require('chalk');
const ora        = require('ora');
const outdent    = require('outdent');

module.exports = {
  populateDb
};

function populateDb() {
  const spinner = ora('Populating DB...').start();

  controller.populateDb().then(() => {
    spinner.succeed();
    console.log(chalk.green(outdent`
      Database successfully populated!
      You may calculate your delivery now.`
    ));
  })
    .catch(err => {
      spinner.fail();
      console.log(chalk.bold.red(`Error occured populating DB: ${err.message}`));
      return handleError(err);
    });
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
