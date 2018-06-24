

const root = './gen';
const debuglog = require('debug')('main');
const fs = require('fs');

var argsparse = require('argparse');
var ArgumentParser = require('argparse').ArgumentParser;
var parser = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'jdbc_sql_client \n node server '
});
parser.addArgument(
  [ '-i', '--input' ],
  {
    help: 'Input file',
    type : 'string',
    nargs : argsparse.Const.OPTIONAL,
    defaultValue : 'queries.txt',
    metavar : 'INPUT_FILENAME'
  }
);
parser.addArgument(
  [ '-o', '--output' ],
  {
    help: 'output file, overwritten!',
    type : 'string',
    nargs : argsparse.Const.OPTIONAL,
    defaultValue : 'out.txt',
    metavar : 'OUTPUT_FILENAME'
  }
);
parser.addArgument(
  [ '--simul' ],
  {
    help: 'bar foo',
    nargs: 0
  }
);

var args = parser.parseArgs();



var fnout = args.output || 'out.txt';
console.log('output file : ' + fnout);

const cfgdata = JSON.parse(fs.readFileSync('jdbcsql_config.json'));
//export function StartRun(fullconfig : any, input : IStatementRun[], testpool : Pool, options : any)

debuglog(' config used ' + JSON.stringify(cfgdata));

const SQLExec = require(root + '/sqlexec.js');

var Pool = require('jdbc');
console.log('config' + JSON.stringify(cfgdata));


var path = require('path');
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
 console.log('adding drivers from ' + cfgdata.classpath);
 jinst.addOption('-Xrs');     
 jinst.setupClasspath(cfgdata.classpath);
}

var Pool = require('jdbc');

config = cfgdata.config;
var testpool = new Pool(config);
testpool.initialize( function () {} );

// /scripts/start_cluster.py --num-relational 1 --num-series 0 --num-docstore 0 --num-disk 0 --num-graph 0  --tc-port=2202  --set-config relational.max_memory=250000000 --reconfigure-interval 3
// /SAPDevelop/hanalite/build/Release/v2client  -clocalhost:2202 -s /SAPDevelop/hanalite_rel_bench/sample_data/gen.viewdef.sql

// v2client -c127.0.0.1 -s sample_data/tcp_viewdef.sql

//var executor = new SQLExec.SQLExec().makeRunner(testpool);
const runner = require(root + '/averages.js');

//var hndl = runner.startOpSequential('CREATE TABLE IF NOT EXISTS T11 ( id int , abc varchar(10));');

//for(var i = 0; i < 1500; ++i) {
// hndl = runner.startOpSequential('INSERT INTO T11 (id, abc) values (' + ( i + 900 + Date.now() % 10000000)  + ', \'zy' + i +' sf\');');
//}


const ParseInput = require('./gen/parseinput.js');

var Pi = new ParseInput.ParseInput(args.input);

var input = Pi.parseString();

console.log('here input  ' + JSON.stringify(input,undefined,2));

runner.startRun(cfgdata, input, testpool, { fnout : fnout }  ); 
//runner.startSequence(executor);


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
