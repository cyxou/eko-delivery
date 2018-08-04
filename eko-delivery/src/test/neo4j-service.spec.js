const proxyquire = require('proxyquire');
const sinon      = require('sinon');
const tap        = require('tap');
const config     = require('../config');
const outdent    = require('outdent');

const fakeSession = {
  run: noop,
  close: noop
};
const fakeDriver = {
  session: () => fakeSession,
  close: () => {}
};

const neo4jMock = {
  v1: {
    auth: { basic: () => {} },
    driver: () => fakeDriver
  }
};

const neo4jService = proxyquire('../neo4j-service', {
  'neo4j-driver': neo4jMock
});

tap.afterEach(done => {
  for (let stub of Object.values(fakeDriver)) {
    if (typeof stub.restore === 'function') stub.restore();
  }
  for (let stub of Object.values(fakeSession)) {
    if (typeof stub.restore === 'function') stub.restore();
  }
  done();
});

tap.test('#populateDb()', async (t) => {
  t.test('should populate db calling corresponding neo4j query', async (tt) => {
    const expected = outdent`
      LOAD CSV WITH HEADERS FROM "file:///${config.dataFileName}" AS row
      MERGE (from:Town {id: row.from, name: row.from})
      MERGE (to:Town {id: row.to, name: row.to})
      CREATE (from)-[:ROUTE {cost: toInt(row.cost)}]->(to)`;

    sinon.stub(fakeSession, 'run').resolves();
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    await neo4jService.populateDb();

    tt.equal(fakeSession.run.firstCall.args[0], expected, 'executed cypher query');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

tap.test('#clearDb()', async (t) => {
  t.test('should clear db calling corresponding neo4j query', async (tt) => {
    const expected = outdent`
      MATCH (a) OPTIONAL MATCH (a)-[r1]-() DELETE a,r1`;

    sinon.stub(fakeSession, 'run').resolves();
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    await neo4jService.clearDb();

    tt.equal(fakeSession.run.firstCall.args[0], expected, 'executed cypher query');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

tap.test('#calculateDeliveryCost()', async (t) => {
  t.test('should return delivery cost for the specified route', async (tt) => {
    const fakeRoute = ['A', 'B', 'C'];
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[:ROUTE]->(t1:Town {name: 'B'})-[:ROUTE]->(t2:Town {name: 'C'})
      WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
      RETURN cost`;
    const expectedCost = 777;

    const fakeResponse = {
      records: [ { _fields: [ {low: expectedCost, high: 0} ] } ]
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculateDeliveryCost(fakeRoute);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed cypher query');
    tt.equal(cost, expectedCost, 'cost as expected');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
  t.test('should return "No Such Route" if provided route does not exist', async (tt) => {
    const fakeRoute = ['A', 'B', 'C'];
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[:ROUTE]->(t1:Town {name: 'B'})-[:ROUTE]->(t2:Town {name: 'C'})
      WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
      RETURN cost`;
    const expectedCost = 'No Such Route';

    const fakeResponse = {
      records: []
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculateDeliveryCost(fakeRoute);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed cypher query');
    tt.equal(cost, expectedCost, 'route does not exist');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

tap.test('#calculatePossibleDeliveryRoutes()', async (t) => {
  t.test('should return number of possible routes between provided towns', async (tt) => {
    const fakeRoute = ['A', 'B'];
    const fakeOpts = {maxStops: 0, routeReuse: true};
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[r*..]->(t1:Town {name: 'B'})
      RETURN count(p)`;
    const expectedNumberOfRoutes = 5;

    const fakeResponse = {
      records: [ { _fields: [ {low: expectedNumberOfRoutes, high: 0} ] } ]
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculatePossibleDeliveryRoutes(fakeRoute, fakeOpts);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed cypher query');
    tt.equal(cost, expectedNumberOfRoutes, 'number of routes as expected');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
  t.test('should return number of possible routes between provided towns within specified max number of stops', async (tt) => {
    const fakeRoute = ['A', 'B'];
    const fakeOpts = {maxStops: 10, routeReuse: true};
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[r*..10]->(t1:Town {name: 'B'})
      RETURN count(p)`;
    const expectedNumberOfRoutes = 5;

    const fakeResponse = {
      records: [ { _fields: [ {low: expectedNumberOfRoutes, high: 0} ] } ]
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculatePossibleDeliveryRoutes(fakeRoute, fakeOpts);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed cypher query');
    tt.equal(cost, expectedNumberOfRoutes, 'number of routes as expected');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

tap.test('#calculateCheapestRoute()', async (t) => {
  t.test('should return the cheapest delivery route between two towns', async (tt) => {
    const fakeRoute = ['A', 'B'];
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[r*..]->(t1:Town {name: 'B'})
      WITH reduce(total = 0, x in relationships(p) | total + x.cost) as cheapestCost
      RETURN cheapestCost
      ORDER BY cheapestCost ASC
      LIMIT 1`;
    const expectedCost = 777;

    const fakeResponse = {
      records: [ { _fields: [ {low: expectedCost, high: 0} ] } ]
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculateCheapestRoute(fakeRoute);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed cypher query');
    tt.equal(cost, expectedCost, 'cost as expected');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

function noop() {}
