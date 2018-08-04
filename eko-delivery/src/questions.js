const inquirer  = require('inquirer');
const defaultConf = require('./config');

module.exports = [
  {
    type: 'list',
    name: 'action',
    message: 'What do you want to do?',
    choices: [
      {
        name: 'Calculate delivery cost for a route',
        value: 'calculateDeliveryCost'
      },
      {
        name: 'Calculate the number of possible delivery routes between two towns',
        value: 'calculatePossibleDeliveryRoutes'
      },
      {
        name: 'Calculate the cheapest delivery route between two towns',
        value: 'calculateCheapestRoute'
      },
      new inquirer.Separator(),
      {
        name: 'Populate the database with data',
        value: 'populateDb'
      },
      {
        name: 'Clear the database',
        value: 'clearDb'
      },
      {
        name: 'Change config parameters',
        value: 'setConfig'
      }
    ]
  },
  {
    type: 'input',
    name: 'route',
    message: 'Type in towns making a route (use spaces or commas as separators)',
    when: answer => answer.action === 'calculateDeliveryCost',
    validate: input => {
      if (!/^\w+([\s,]+\w+)+$/.test(input)) {
        return 'Provide at least two towns to make a route';
      } else return true;
    }
  },
  {
    type: 'input',
    name: 'route',
    message: 'Type in two towns making a route (use spaces or commas as separators)',
    when: answer =>
      answer.action === 'calculatePossibleDeliveryRoutes' || answer.action === 'calculateCheapestRoute',
    validate: input => {
      if (!/^\w+[\s,]+\w+$/.test(input)) {
        return 'Provide exactly two towns to make a route';
      } else return true;
    },
    filter: input => {
      return input.replace(/\s+/g, ',').split(',').reduce((acc, item) => {
        item !== '' && acc.push(item.trim());
        return acc;
      }, []);
    }
  },
  {
    type: 'input',
    name: 'maxStops',
    message: 'How many stops are allowed for the route?',
    when: answer => answer.action === 'calculatePossibleDeliveryRoutes',
    validate: input => {
      if (!/^\d+$/.test(input)) {
        return 'Must be an integer value';
      } else return true;
    }
  },
  {
    type: 'confirm',
    name: 'routeReuse',
    message: 'Allow to use the same route twice?',
    default: true,
    when: answer => answer.action === 'calculatePossibleDeliveryRoutes'
  },
  {
    type: 'confirm',
    name: 'confirmPopulateDb',
    message: 'Please don\'t do it unless your database is clean. Otherwise clear the database first. Continue?',
    default: false,
    when: answer => answer.action === 'populateDb'
  },
  {
    type: 'confirm',
    name: 'confirmClearDb',
    message: 'Are you sure you want to clear all data from the database?',
    default: false,
    when: answer => answer.action === 'clearDb'
  },
  {
    type: 'input',
    name: 'dataFile',
    message: 'Name of CSV file for database population',
    default: defaultConf.dataFileName,
    when: answer => answer.action === 'setConfig'
  },
  {
    type: 'input',
    name: 'neo4jUri',
    message: 'Type in Neo4j uri including port number if it differs from default',
    default: defaultConf.neo4j.uri,
    when: answer => answer.action === 'setConfig'
  },
  {
    type: 'input',
    name: 'neo4jUser',
    message: 'Type in Neo4j user to use for authentification',
    default: defaultConf.neo4j.user,
    when: answer => answer.action === 'setConfig'
  },
  {
    type: 'password',
    name: 'neo4jPassword',
    message: 'Type in Neo4j password to use for authentification',
    default: defaultConf.neo4j.password,
    when: answer => answer.action === 'setConfig'
  }
];
