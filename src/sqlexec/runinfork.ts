
console.log('I AM RUNNING THE FORK!');
var root = (process.env.FSD_COVERAGE) ? './gen_cov' : './gen';

var debug = require('debug');
const debuglog = debug('runinfork');

var configFileName = process.argv[2] || `${__dirname}\\..\\configs\\config_derby.js`;

console.log('configfilename ' + configFileName);
var config = require(configFileName).config
var Pool = require('jdbc');
console.log('config' + JSON.stringify(config));

const SQLExec = require('./sqlexec.js');

var testpool = new Pool(config);

testpool.initialize( function () {} );

// /scripts/start_cluster.py --num-relational 1 --num-series 0 --num-docstore 0 --num-disk 0 --num-graph 0  --tc-port=2202  --set-config relational.max_memory=250000000 --reconfigure-interval 3
// /SAPDevelop/hanalite/build/Release/v2client  -clocalhost:2202 -s /SAPDevelop/hanalite_rel_bench/sample_data/gen.viewdef.sql
// v2client -c127.0.0.1 -s sample_data/tcp_viewdef.sql

var executor = new SQLExec.SQLExec().makeRunner(testpool);
// this executable listens to single query requests (without any synchronization etc)
// and runs them
process.on('message', (m) => {
  console.log('IN FORK got ' + JSON.stringify(m));
  if(!m.statement) {
    return;
  }
  executor.execStatement(m.statement).then( res =>
    {
      var m2 =  { handle : m.handle, result : res.result , err : undefined };
      console.log(' in fork send result' + JSON.stringify(m2));
      process.send(m2);
    }
  ).catch( err => {
    try {
      err = err.toString();
    } catch (e) {
    }
    var m2 =  { handle : m.handle, result : undefined, err : err};
    console.log(' in fork send result' + JSON.stringify(m2));
    process.send( m2 );
  }
)
});
console.log('I HAVE REGISTERED THE HANDLER!');