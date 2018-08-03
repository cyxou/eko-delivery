const neo4j   = require('neo4j-driver').v1;
const config  = require('./config');
const outdent = require('outdent');

const driver = neo4j.driver(
  config.neo4j.uri,
  neo4j.auth.basic(config.neo4j.user, config.neo4j.password)
);
const session = driver.session();

module.exports = {
  populateDb
};

/**
 * Populates database with data from the sample-data.csv file located
 * int the ../neo4j/import directory.
 *
 * @returns {Promise}
 */
async function populateDb() {
  const populationQuery = outdent`
    LOAD CSV WITH HEADERS FROM "file:///${config.dataFileName}" AS row
    MERGE (from:Town {id: row.from, name: row.from})
    MERGE (to:Town {id: row.to, name: row.to})
    CREATE (from)-[:ROUTE {cost: toInt(row.cost)}]->(to)`;

  try {
    const result = await session.run(populationQuery);

    // Additionaly create index on town names
    await session.run('CREATE INDEX ON :Town(name)');

    session.close();
    driver.close();

    return Promise.resolve(result);

  } catch(err) {
    session.close();
    driver.close();
    return Promise.reject(err);
  }
}
