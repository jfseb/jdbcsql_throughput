'use strict';
//var jinst = require('jdbc/lib/jinst');
var AsciiTable = require('ascii-table');
var _ = require('lodash');

var TPool = require('jdbc').Pool;

import { ISQLExecutor} from './constants';




  /**
 * "Fixes the node-jdbc collect to also accept "
 * @param {*} callback
 */
var ResultSet_toObjectIter = function (callback) {
  var self = this;

  self.getMetaData(function (err, rsmd) {
    if (err) {
      return callback(err);
    } else {
      var colsmetadata = [];

      rsmd.getColumnCount(function (err, colcount) {

        if (err)
          return callback(err);

        // Get some column metadata.
        _.each(_.range(1, colcount + 1), function (i) {
          colsmetadata.push({
            // modification, fall back to column name
            label:  rsmd._rsmd.getColumnLabelSync(i) || rsmd._rsmd.getColumnNameSync(i),
            type: rsmd._rsmd.getColumnTypeSync(i)
          });
        });

        callback(null, {
          labels: _.map(colsmetadata, 'label'),
          types: _.map(colsmetadata, 'type'),
          rows: {
            next: function () {
              var nextRow;
              try {
                nextRow = self._rs.nextSync(); // this row can lead to Java RuntimeException - sould be cathced.
              }
              catch (error) {
                callback(error);
              }
              if (!nextRow) {
                return {
                  done: true
                };
              }

              var result = {};

              // loop through each column
              _.each(_.range(1, colcount + 1), function (i) {
                var cmd = colsmetadata[i - 1];
                var type = self._types[cmd.type] || 'String';
                var getter = 'get' + type + 'Sync';

                if (type === 'Date' || type === 'Time' || type === 'Timestamp') {
                  var dateVal = self._rs[getter](i);
                  result[cmd.label] = dateVal ? dateVal.toString() : null;
                } else {
                  // If the column is an integer and is null, set result to null and continue
                  if (type === 'Int' && _.isNull(self._rs.getObjectSync(i))) {
                    result[cmd.label] = null;
                    return;
                  }

                  result[cmd.label] = self._rs[getter](i);
                }
              });

              return {
                value: result,
                done: false
              };
            }
          }
        });
      });
    }
  });
};

export class SQLExec {
  Pool : any;
  /*
  var config = {
//    url: 'jdbc:hsqldb:hsql://localhost/xdb',
//    user: 'SA',
    libpath : './drivers/hl-jdbc-2.3.90.jar',
    drivername : 'com.sap.vora.jdbc.VoraDriver',
    url : 'jdbc:hanalite://' + '127.0.0.1:2202',
    //url : 'jdbc:hanalite://' + '127.0.0.1:2202' + '/?resultFormat=binary',
    user : '',
    logging : 'info',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 500
//    properties : {user: '', password : ''}
  };
  */
  constructor(options : any) {
    this.Pool = TPool;
  }

  makeAsciiTable(obj : any) {
    /*
    const table1 = new AsciiTable();
    table1.setHeading('a','b','c')
      .addRow('a', 'apple', 'Some longer string');
    table1.addRow('b', 'banana', 'hi')
      .addRow('c', 'carrot', 'meow')
      .addRow('e', 'elephants');
    console.log(table1.toString());
   */
    const table = new AsciiTable();

    //const table2 = new AsciiTable();
    //console.log(table2.toString());

    if(obj.length  > 0 ) {
      var arr = Object.getOwnPropertyNames(obj[0]);
      console.log('here arr' + arr);
      table.setHeading.apply(table, arr);
    }
    if(obj.length > 0) {
      Object.getOwnPropertyNames(obj[0]).forEach( (key,idx) =>
      {
        var val = obj[0][key];
        if( typeof val == "number") {
          table.setAlign(idx, AsciiTable.RIGHT );
        } else {
          table.setAlign(idx, AsciiTable.LEFT );
        }
      });
    }
    obj.forEach( function(entry) {
      console.log( JSON.stringify(entry));
      console.log(' here ' +  JSON.stringify(obj[0]));
      var arr2 = Object.getOwnPropertyNames(obj[0]).map(function(key) { return entry[key];});
      table.addRow.apply(table, arr2);
    });
    if(obj.length > 0) {
      Object.getOwnPropertyNames(obj[0]).forEach( (key,idx) =>
      {
        var val = obj[0][key];
        if( typeof val == "number") {
          table.setAlign(idx, AsciiTable.RIGHT);
        } else {
          table.setAlign(idx, AsciiTable.LEFT );
        }
      });
    }
    return table.toString();
  };
  /* table
    .addRow('a', 'apple', 'Some longer string')
    .addRow('b', 'banana', 'hi')
    .addRow('c', 'carrot', 'meow')
    .addRow('e', 'elephants')
*/


  makeRunner = function(testpool) : ISQLExecutor {
    var that = this;
    var r = {
      pool: testpool ,
      execStatement : function(statement) {
        return that.runStatementFromPool(statement, testpool);
      }
    };
    return r;
  };

  getExecutors(pool, nr : number)  : ISQLExecutor[]{
    var u = new SQLExec(pool);
    var res = [];
    for(var i = 0; i < nr; ++i )
    {
      res.push(u.makeRunner(pool));
    }
    return res;
  };

  /**
   *
   * @param statement
   * @param testpool
   */
  runStatementFromPool(statement : string , testpool : any) : Promise<any>
  {
    return new Promise(function(resolve, reject)
    {
      var connObj = undefined;
      var callback = function(err, result?) {
        if(connObj) {
          testpool.release(connObj, function(err2) {
            if (err2) {
              console.log('error releasing connection');
            }
            if( err) {
              reject(err);
              return;
            }
            resolve({ pool: testpool, conn: result.conn, result: result.result});
          });
          return;
        }
        if(err) {
          reject(err);
          return;
        }
        resolve({ pool: testpool, conn: result.conn, result: result.result});
      };
      testpool.reserve( function(err, aconnObj)
      {
        if(err) {
          callback(err);
          return;
        }
        connObj = aconnObj;
        var conn = connObj.conn;
        conn.createStatement( function (err, sqlstatement)
        {
          if(err) {
            callback(err);
            return;
          }
          //statement.executeQuery('CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));'
          //statement.executeQuery('INSERT INTO T1 (id, abc) values (2, \'def\');'
          sqlstatement.executeQuery(statement, function(err, resultSet)
          {
            if(err) {
              callback(err);
              return;
            }
            resultSet.toObjectIter = ResultSet_toObjectIter;
            resultSet.toObjArray(function(err, results) {
              if(err) {
                callback(err);
                return;
              }
              if(results.length <= 0) {
                console.log(' no length result ');
              }
              callback(null, { conn: conn, result: results} );
            });
          });
        });
      });
    });
  };

}

