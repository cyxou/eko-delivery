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
  t.test('should populate db calling corresponding neo4j method', async (tt) => {
    const expected = outdent`
      LOAD CSV WITH HEADERS FROM "file:///${config.dataFileName}" AS row
      MERGE (from:Town {id: row.from, name: row.from})
      MERGE (to:Town {id: row.to, name: row.to})
      CREATE (from)-[:ROUTE {cost: toInt(row.cost)}]->(to)`;

    sinon.stub(fakeSession, 'run').resolves();
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    await neo4jService.populateDb();

    tt.equal(fakeSession.run.firstCall.args[0], expected, 'executed population query');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

tap.test('#populateDb()', async (t) => {
  t.test('should return delivery cost for the specified route', async (tt) => {
    const fakeRoute = ['A', 'B', 'C'];
    const expectedQuery = outdent`
      MATCH p = (t0:Town {name: 'A'})-[:ROUTE]->(t1:Town {name: 'B'})-[:ROUTE]->(t2:Town {name: 'C'})
      WITH reduce(total = 0, x in relationships(p)| total + x.cost) as cost
      RETURN cost`;
    const expectedCost = 777;

    const fakeResponse = {
      records: [
        {
          _fields: [
            {low: expectedCost, high: 0}
          ]
        }
      ]
    };

    sinon.stub(fakeSession, 'run').resolves(fakeResponse);
    sinon.spy(fakeSession, 'close');
    sinon.spy(fakeDriver, 'close');

    const cost = await neo4jService.calculateDeliveryCost(fakeRoute);

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed population query');
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

    tt.equal(fakeSession.run.firstCall.args[0], expectedQuery, 'executed population query');
    tt.equal(cost, expectedCost, 'route does not exist');
    tt.ok(fakeSession.close.calledOnce, 'session was closed');
    tt.ok(fakeDriver.close.calledOnce, 'driver connection was closed');
  });
});

function noop() {}
