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

function noop() {}
