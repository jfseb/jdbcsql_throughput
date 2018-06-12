
'use strict';

var jinst = require('jdbc/lib/jinst');
var Pool = require('jdbc').Pool;
var AsciiTable = require('ascii-table');

if (!jinst.isJvmCreated()) {
  jinst.addOption('-Xrs');
  var root = '';
  jinst.setupClasspath([root + './drivers/hsqldb.jar', root + './drivers/derby.jar', root + './drivers/derbyclient.jar', root + './drivers/derbytools.jar']);
}

var SQLExec = function () {
  var config = {
    url: 'jdbc:hsqldb:hsql://localhost/xdb',
    user: 'SA',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 500
  };

  function SQLExec(options) {
    this.replyCnt = 0;
    this.answerHooks = {};
    this.user = options && options.user || 'user1';
    this.bot = options && options.bot || 'fdevstart';
    // this.conversationID = options && options.conversationid || ('' + Date.now())
  }

  SQLExec.prototype.Pool = Pool;

  SQLExec.prototype.config = config;

  SQLExec.prototype.aFunction = function (answerHook, id) {
    if (id) {
      this.answerHooks[id] = answerHook;
    }
  };

  SQLExec.prototype.makeAsciiTable = function (obj) {
    var table1 = new AsciiTable();
    table1.setHeading('a', 'b', 'c').addRow('a', 'apple', 'Some longer string');
    table1.addRow('b', 'banana', 'hi').addRow('c', 'carrot', 'meow').addRow('e', 'elephants');
    console.log(table1.toString());
    var table = new AsciiTable();

    var table2 = new AsciiTable();
    console.log(table2.toString());

    if (obj.length > 0) {
      var arr = Object.getOwnPropertyNames(obj[0]);
      console.log('here arr' + arr);
      table.setHeading.apply(table, arr);
    }
    obj.forEach(function (entry) {
      console.log(JSON.stringify(entry));
      console.log(' here ' + JSON.stringify(obj[0]));
      var arr2 = Object.getOwnPropertyNames(obj[0]).map(function (key) {
        return entry[key];
      });
      table.addRow.apply(table, arr2);
    });
    return table.toString();
  };
  /* table
   .addRow('a', 'apple', 'Some longer string')
   .addRow('b', 'banana', 'hi')
   .addRow('c', 'carrot', 'meow')
   .addRow('e', 'elephants')
  */

  SQLExec.prototype.makeRunner = function (testpool) {
    var r = {
      pool: testpool,
      execStatement: function execStatement(statement) {
        return SQLExec.prototype.runStatementFromPool(statement, testpool);
      }
    };
    return r;
  };

  SQLExec.prototype.runStatementFromPool = function (statement, testpool) {
    return new Promise(function (resolve, reject) {
      var connObj = undefined;
      var callback = function callback(err, result) {
        if (connObj) {
          testpool.release(connObj, function (err2) {
            if (err2) {
              console.log('error releasing connection');
            }
            if (err) {
              reject(err);
              return;
            }
            resolve({ pool: testpool, conn: result.conn, result: result.result });
          });
          return;
        }
        if (err) {
          reject(err);
          return;
        }
        resolve({ pool: testpool, conn: result.conn, result: result.result });
      };
      testpool.reserve(function (err, aconnObj) {
        if (err) {
          callback(err);
          return;
        }
        connObj = aconnObj;
        var conn = connObj.conn;
        conn.createStatement(function (err, sqlstatement) {
          if (err) {
            callback(err);
            return;
          }
          //statement.executeQuery('CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));'
          //statement.executeQuery('INSERT INTO T1 (id, abc) values (2, \'def\');'
          sqlstatement.executeQuery(statement, function (err, resultSet) {
            if (err) {
              callback(err);
              return;
            }
            resultSet.toObjArray(function (err, results) {
              if (err) {
                callback(err);
                return;
              }
              if (results.length > 0) {
                console.log('ID: ' + JSON.stringify(results));
              } else {
                console.log(' no length result ');
              }
              callback(null, { conn: conn, result: results });
            });
          });
        });
      });
    });
  };
  return SQLExec;
}();

exports.SQLExec = SQLExec;