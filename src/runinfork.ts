import { SQLExec } from "./sqlexec";
import { ISQLExecutor } from "./constants";

console.log('I AM RUNNING THE FORK!' + process.argv[2]);
var root = './gen';

var debug = require('debug');
const debuglog = debug('runinfork');

var fs = require('fs');
var cfgdata = undefined;
var sqlexec = undefined;
var testpool = undefined;
/*
try {
var dataf = fs.readFileSync('jdbcsql_config.json');
    cfgdata = JSON.parse(dataf);
} catch(e)
{
  console.log('could not read ./jdbcsql_config.json, falling back to default config' + e)
}*/

var root = `${__dirname}/../`; // eslint-disable-line
var defaultConfig = {
  classpath : [
  root + './drivers/hsqldb.jar',
  root + './drivers/derby.jar',
  root + './drivers/derbyclient.jar',
  root + './drivers/derbytools.jar'],
  config : {
      url: 'jdbc:hsqldb:hsql://localhost/xdb',
      user: 'SA',
      logging : 'info',
      password: '',
      minpoolsize: 2,
      maxpoolsize: 50
      //  properties : {user: '', password : ''}
    }
  };

var executor : ISQLExecutor = undefined;

function SetupOnce(cfgdata) {
  console.log('IN FORK Setup got config ' + JSON.stringify(cfgdata));
  cfgdata = cfgdata || defaultConfig;
  if(!cfgdata.config) {
    cfgdata = defaultConfig;
  }
  console.log('IN FORK amended config ' + JSON.stringify(cfgdata));

  var path = require('path');
  var jinst = require('jdbc/lib/jinst');
  if (!jinst.isJvmCreated()) {
   console.log('adding drivers from ' + cfgdata.classpath);
    jinst.addOption('-Xrs');
    jinst.setupClasspath(cfgdata.classpath);
  }
  var Pool = require('jdbc');
  var config = cfgdata.config;
  testpool = new Pool(config);
  testpool.initialize(function() {});
  sqlexec = require('./sqlexec.js');
  console.log('FORK configured!');
  executor = new sqlexec.SQLExec().makeRunner(testpool);

}
// /scripts/start_cluster.py --num-relational 1 --num-series 0 --num-docstore 0 --num-disk 0 --num-graph 0  --tc-port=2202  --set-config relational.max_memory=250000000 --reconfigure-interval 3
// /SAPDevelop/hanalite/build/Release/v2client  -clocalhost:2202 -s /SAPDevelop/hanalite_rel_bench/sample_data/gen.viewdef.sql
// v2client -c127.0.0.1 -s sample_data/tcp_viewdef.sql


// this executable listens to single query requests (without any synchronization etc)
// and runs them
process.on('message', (m) => {
  if(m && m.cfgdata) {
    SetupOnce(m.cfgdata);
    return;
  }
  debuglog('IN FORK got ' + JSON.stringify(m));
  if(!m.statement) {
    return;
  }
  executor.execStatement(m.statement).then( res =>
    {
      var m2 =  { handle : m.handle, result : res.result , err : undefined };
      debuglog(' in fork send result' + JSON.stringify(m2));
      process.send(m2);
    }
  ).catch( err => {
    try {
      err = err.toString();
    } catch (e) {
    }
    var m2 =  { handle : m.handle, result : undefined, err : err};
    console.log(' in fork send Err result' + JSON.stringify(m2));
    process.send( m2 );
  }
)
});
console.log('I HAVE REGISTERED THE HANDLER!');