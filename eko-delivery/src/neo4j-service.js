const neo4j       = require('neo4j-driver').v1;
const Configstore = require('configstore');
const pkg         = require('../package.json');
const outdent     = require('outdent');

const config = new Configstore(pkg.name);

const driver = neo4j.driver(
  config.get('neo4j.uri'),
  neo4j.auth.basic(config.get('neo4j.user'), config.get('neo4j.password'))
);
const session = driver.session();

module.exports = {
  populateDb,
  clearDb,
  calculateDeliveryCost,
  calculatePossibleDeliveryRoutes,
  calculateCheapestRoute
};

/**
 * Populates database with data from the sample-data.csv file located
 * int the ../neo4j/import directory.
 *
 * @returns {Promise}
 */
async function populateDb() {
  const populationQuery = outdent`
    LOAD CSV WITH HEADERS FROM "file:///${config.get('dataFileName')}" AS row
    MERGE (from:Town {id: row.from, name: row.from})
    MERGE (to:Town {id: row.to, name: row.to})
    CREATE (from)-[:ROUTE {cost: toInt(row.cost)}]->(to)`;

  try {
    await session.run(populationQuery);

    // Additionaly create index on town names
    return makeDbRequest('CREATE INDEX ON :Town(name)');
  } catch(err) {
    session.close();
    driver.close();
    return Promise.reject(err);
  }
}

/**
 * Clears database
 *
 * @returns {Promise}
 */
async function clearDb() {
  const query = outdent`
    MATCH (a) OPTIONAL MATCH (a)-[r1]-() DELETE a,r1`;

  return makeDbRequest(query);
}

/**
 * Calculate delivery cost for the specified route.
 *
 * @param {string[]} route Array of towns representing a route
 * @returns {Promise}
 */
function calculateDeliveryCost(route) {
  let matchClause = 'MATCH p = ';
  matchClause = route.reduce((res, item, idx) => {
    const len = route.length;
    res = `${res}(t${idx}:Town {name: '${item}'})${idx == len - 1 ? '' : '-[:ROUTE]->'}`;
    return res;
  }, matchClause);

  const query = outdent`
    ${matchClause}
    WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
    RETURN cost
  `;

  return makeDbRequest(query);
}

/**
 * Calculate possible delivery routes between two towns.
 *
 * @param {string[]} route Array of two towns, 'from' and 'to'
 * @param {Object} opts
 * @param {number} [opts.maxStops=0] Maximum number of stops for the route
 * @param {boolean} [opts.routeReuse=true] Allow to to use the same route twice
 * @returns {Promise}
 */
function calculatePossibleDeliveryRoutes([from, to], opts) {
  let query = outdent`
    MATCH p = (t0:Town {name: '${from}'})-[r*..${opts.maxStops ? opts.maxStops : ''}]->(t1:Town {name: '${to}'})
    RETURN count(p)`;

  return makeDbRequest(query);
}

/**
 * Calculate the cheapest delivery route between two towns
 *
 * @param {string[]} route Array of towns representing a route
 * @returns {Promise}
 */
function calculateCheapestRoute([from, to]) {
  let query = outdent`
    MATCH p = (t0:Town {name: '${from}'})-[r*..]->(t1:Town {name: '${to}'})
    WITH reduce(total = 0, x in relationships(p) | total + x.cost) as cheapestCost
    RETURN cheapestCost
    ORDER BY cheapestCost ASC
    LIMIT 1`;

  return makeDbRequest(query);
}

async function makeDbRequest(query) {
  try {
    const res = await session.run(query);
    //console.log('Response: ', JSON.stringify(res, true, 5));

    session.close();
    driver.close();

    return Promise.resolve(parseResponse(res));

  } catch(err) {
    session.close();
    driver.close();
    return Promise.reject(err);
  }
}

function parseResponse(response) {
  if (!response) return;
  if (!response.records.length) return 'No Such Route';

  const cost = response.records[0]._fields[0].low;

  return cost;
}
