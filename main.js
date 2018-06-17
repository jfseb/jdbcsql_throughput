

var root = (process.env.FSD_COVERAGE) ? './gen_cov' : './gen';

var debug = require('debug');
//const debuglog = debug('main');

const SQLExec = require(root + '/sqlexec.js');

var config = new SQLExec.SQLExec().config;
var Pool = require('jdbc');
config = new SQLExec.SQLExec().config;
console.log('config' + JSON.stringify(config));

var testpool = new Pool(config);
testpool.initialize( function () {} );


// /scripts/start_cluster.py --num-relational 1 --num-series 0 --num-docstore 0 --num-disk 0 --num-graph 0  --tc-port=2202  --set-config relational.max_memory=250000000 --reconfigure-interval 3
// /SAPDevelop/hanalite/build/Release/v2client  -clocalhost:2202 -s /SAPDevelop/hanalite_rel_bench/sample_data/gen.viewdef.sql

// v2client -c127.0.0.1 -s sample_data/tcp_viewdef.sql

var executor = new SQLExec.SQLExec().makeRunner(testpool);
const runner = require(root + '/averages.js');

//var hndl = runner.startOpSequential('CREATE TABLE IF NOT EXISTS T11 ( id int , abc varchar(10));');

//for(var i = 0; i < 1500; ++i) {
// hndl = runner.startOpSequential('INSERT INTO T11 (id, abc) values (' + ( i + 900 + Date.now() % 10000000)  + ', \'zy' + i +' sf\');');
//}

runner.startSequence(executor);


// we sample every T / 20 and N / 20  (if specified)
// we take the value closest to 80% completion,
// then we take the average with a duration < 40% of the time.

//--

//--P=20 T=50000 N=300  TAG=ABC
// QUERY STATEMENT
//

//  LINE, TAG,  P, %OK, %FAIL, TP(QPS) ,  MAXMEM, NUM_PAR,  AVG_CPU, AVG_MEM , DATE, FILE, LINE
//  17  ,    ,   ,    ,      ,                                     ,         ,


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
