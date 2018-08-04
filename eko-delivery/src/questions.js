const inquirer  = require('inquirer');

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
      {name: 'Populate database with new data', value: 'populateDb'}
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
  }

];
