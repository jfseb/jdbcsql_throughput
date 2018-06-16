var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../gen';
// var _ = require('lodash');
// var debuglog = require('debug')('plainRecoginizer.nunit')

var debug = require('debug');
const debuglog = debug('sqlexec.nunit');

// strongly recommended to load this first, as it brings up the jvm,
// setting classpath variables!
const config = require(root + '/configs/config_derby.js').config;

var Pool = require('jdbc');

const SQLExec = require(root + '/sqlexec/sqlexec.js');

console.log('config' + JSON.stringify(config));
// var HTMLConnector = require(root + '/ui/htmlconnector.js')
// const SmartDialog = require(root + '/bot/smartdialog.js')

exports.testNotExistTable = function(test) {
  console.log('config' + JSON.stringify(config));
  var testpool = new Pool(config);
  var executor = new SQLExec.SQLExec();
  //var s1 = 'CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));';
  //var s2 = 'INSERT INTO T1 (id, abc) values (2, \'def\');';
  //var s3 = 'DELETE FROM T1;';
  var s4 = 'SELECT * FROM T1_NEVER;';

  executor.runStatementFromPool(s4, testpool).then( function(T)
  {
    console.log(JSON.stringify(T));
    test.deepEqual(false, undefined);
    test.done();
  }).catch(function(err) {
    console.log('here err: ' + err + JSON.stringify(err) + ' typof' + typeof err);
    test.deepEqual(!!( ('' + err).indexOf('T1_NEVER') > 0), true);
    test.deepEqual(err, err);
    test.done();
  });
};

exports.testAsciiTable = function(test) {

  const exec = new SQLExec.SQLExec();

  var res = exec.makeAsciiTable( [{ ID: 1, Obj : 'def'},
   { ID: 3, Obj : 'def'}]);

  console.log(res);

  var expect =
`.----------.
| ID | Obj |
|----|-----|
|  1 | def |
|  3 | def |
'----------'`;

  test.deepEqual(res, expect);4;

  test.done();
};


exports.testAsciiTable2 = function(test) {

  const exec = new SQLExec.SQLExec();

  var res = exec.makeAsciiTable( [{ ID: 1.123, Obj : 'def'},
   { ID: 3.34, Obj : 'def'}]);

  console.log(res);

  var expect =
`.-------------.
|  ID   | Obj |
|-------|-----|
| 1.123 | def |
|  3.34 | def |
'-------------'`;

  test.deepEqual(res, expect);4;

  test.done();
};


exports.testGetExecutors = function(test) {
  console.log('config' + JSON.stringify(config));
  var testpool = new Pool(config);
  var executors = SQLExec.getExecutors(testpool, 4);
  test.deepEqual(executors.length,4);
};

exports.testCreateDelete2 = function(test) {
  console.log('config' + JSON.stringify(config));
  var testpool = new Pool(config);
  var executor = new SQLExec.SQLExec();
  var s1 = 'CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));';
  var s2a = 'INSERT INTO T1 (id, abc) values (1, \'def\');';
  var s2b = 'INSERT INTO T1 (id, abc) values (2, \'hij\');';
  var s3 = 'DELETE FROM T1;';
  var s4 = 'SELECT * FROM T1;';

  executor.runStatementFromPool(s1, testpool).then( function(T)
  {
    return executor.runStatementFromPool(s3, testpool);
  }).then(function (T) {
    return executor.runStatementFromPool(s2a, testpool);
  }).then(function (T) {
    return executor.runStatementFromPool(s2b, testpool);
  }).then(function(T) {
    return executor.runStatementFromPool(s4, testpool);
  }).then(function(R) {
    console.log(' here result:' + JSON.stringify(R.result,undefined,2));
    test.deepEqual(R.result.length, 2);
    test.done();
  }).catch(function(err) {
    console.log(err);
    test.deepEqual(err, 'should not get here', 'rejection');
    test.done();
  });
};

exports.testSQL2 = function (test) {
  console.log('config' + JSON.stringify(config));
  var callback = function(err, res) {
    if(err) {
      console.log(err);
      test.deepEqual(undefined,err, 'err');
      test.done();
    }
    test.deepEqual(res, [
      { ID : 1, ABC : 'def'},
      { ID : 2, ABC : 'hij'}
    ]);
    console.log(res);
    test.done();
  };
  var testpool = new Pool(config);
  testpool.reserve( function(err, connObj)
  {
    if(err)
    {
      callback(err);
      test.deepEqual(0,1, 'no conn');
      test.done();
      return;
    }
    var conn = connObj.conn;
    conn.createStatement( function (err, statement)
    { if(err) {
      callback(err);
      return;
    }
     //statement.executeQuery('CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));'
      //statement.executeQuery('INSERT INTO T1 (id, abc) values (2, \'def\');'
      statement.executeQuery('SELECT * FROM T1;'
   , function(err, resultSet)
      {
     if(err) {
       callback(err);
       return;
     }
     resultSet.toObjArray(function(err, results) {
       if(err) {
         callback(err);
         return;
       }
       if(results.length > 0) {
         console.log('ID: ' + JSON.stringify(results));
       }
       callback(null, results);
     });
   });
    });
    debuglog('aaa');
    test.deepEqual('a', 'a');
  });
};

/*
module.exports = {
  setUp: function (callback) {
    if (testpool === null) {
      testpool = new Pool(config);
    }
    callback();
  },
  testinitialize: function (test) {
    // Initialize the pool (create minpoolsize connections)
    testpool.initialize(function (err) {
      test.expect(1);
      test.equal(null, err);
      test.done();
    });
  },
  testreserve: function (test) {
    // Reserve a connection.
    testpool.reserve(function (err, conn) {
      test.expect(4);
      test.equal(null, err);
      test.ok(conn && typeof conn == 'object');
      test.equal(testpool._pool.length, 1);
      test.equal(testpool._reserved.length, 1);
      testconn = conn;
      test.done();
    });
  },
  testrelease: function (test) {
    // Release a connection.
    testpool.release(testconn, function (err, conn) {
      test.expect(3);
      test.equal(null, err);
      test.equal(testpool._pool.length, 2);
      test.equal(testpool._reserved.length, 0);
      testconn = null;
      test.done();
    });
  },
  testreserverelease: function (test) {
    // Reserve then release a connection.
    testpool.reserve(function (err, conn) {
      if (err) {
        console.log(err);
      } else {
        testpool.release(conn, function (err) {
          test.expect(3);
          test.equal(null, err);
          test.equal(testpool._pool.length, 2);
          test.equal(testpool._reserved.length, 0);
          test.done();
        });
      }
    });
  },
  testreservepastmin: function (test) {
    // Reserve connections past minpoolsize.  This will grow the pool.
    var conns = [];
    var i;
    for (i = 0; i < 3; i++) {
      testpool.reserve(function (err, conn) {
        conns.push(conn);
        if (i == 3) {
          test.expect(2);
          test.equal(testpool._pool.length, 0);
          test.equal(testpool._reserved.length, 3);
          _.each(conns, function (conn) {
            testpool.release(conn, function (err) {});
          });
          test.done();
        }
      });
    }
  },
  testovermax: function (test) {
    // Reserve connections past maxpoolsize.  This will max out the pool, and
    // throw an error when the last reserve request is made.
    var conns = [];
    var i;
    for (i = 0; i < 4; i++) {
      testpool.reserve(function (err, conn) {
        if (err) {
          if (i == 3) {
            test.expect(3);
            test.ok(err);
            test.equal(testpool._reserved.length, 3);
            test.equal(testpool._pool.length, 0);
            _.each(conns, function (conn) {
              testpool.release(conn, function (err) {});
            });
            test.done();
          } else {
            console.log(err);
          }
        } else {
          conns.push(conn);
        }
      });
    }
  }
};

*/