
var t = require('tap');

//const config = require(root + '/configs/config_derby.js');
//const SQLExec = require(root + '/sqlexec_remote.js');

const Averages = require('../gen/averages.js');



/*
var root = `${__dirname}/../../`; // eslint-disable-line
var exampleConfig = {
  port : 3000,
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
  }
};
*/

var results = [ {
  'ABC' : 123,
  'DEF' : 'str',
  'KDSF' : 'asdf'
},
{
  'ABC' : -40.1,
  'DEF' : 'uu',
  'KDSF' : 'sfsf'
}
];

t.test('testDumpAllResultsToCSV', function(test) {
  console.log(Object.getOwnPropertyNames(Averages));
  var result = Averages.dumpAllResultsToCSV(results);
  var expected =
`ABC,DEF,KDSF
123,str,asdf
-40.1,uu,sfsf
`;
  test.deepEqual(result, expected);
  test.done();
});


t.test('testDumpAllResults', function(test) {
  Averages.dumpAllResults(results);
  test.deepEqual(true, true );
  test.done();
});




var root = `${__dirname}/../`; // eslint-disable-line

var exampleConfig = {
  port : 3000,
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

t.test('testRunAverages' , function(test) {
  test.plan(2);
  //??  const SQLExec = require(root + '/sqlexec.js');
  var cfgdata = exampleConfig;
  var Pool = require('jdbc');

  //var path = require('path');
  var jinst = require('jdbc/lib/jinst');

  if (!jinst.isJvmCreated()) {
    console.log('adding drivers from ' + cfgdata.classpath);
    jinst.addOption('-Xrs');
    jinst.setupClasspath(cfgdata.classpath);
  }

  // var Pool = require('jdbc');

  var config = cfgdata.config;
  var testpool = new Pool(config);
  testpool.initialize( function () {} );

  // /scripts/start_cluster.py --num-relational 1 --num-series 0 --num-docstore 0 --num-disk 0 --num-graph 0  --tc-port=2202  --set-config relational.max_memory=250000000 --reconfigure-interval 3
  // /SAPDevelop/hanalite/build/Release/v2client  -clocalhost:2202 -s /SAPDevelop/hanalite_rel_bench/sample_data/gen.viewdef.sql

  // v2client -c127.0.0.1 -s sample_data/tcp_viewdef.sql

  //var executor = new SQLExec.SQLExec().makeRunner(testpool);
  const runner = require('../gen/averages.js');

  //var hndl = runner.startOpSequential('CREATE TABLE IF NOT EXISTS T11 ( id int , abc varchar(10));');

  //for(var i = 0; i < 1500; ++i) {
  // hndl = runner.startOpSequential('INSERT INTO T11 (id, abc) values (' + ( i + 900 + Date.now() % 10000000)  + ', \'zy' + i +' sf\');');
  //}


  const ParseInput = require('../gen/parseinput.js');
  var fs = require('fs');
  var Pi = new ParseInput.ParseInput('test/test_input.txt');
  var input1 = Pi.parseString();
  console.log('test 1');
  test.deepEqual(input1, [
    {
      'parallel': 20,
      'statement': 'SELECT * FROM T1PAR;',
      'tag': 'ABC',
      'terminate_delta_t': undefined,
      'terminate_nr': 40
    }
  ]);
  console.log('here input  ' + JSON.stringify(input,undefined,2));

  var input = [
    { tag : 'ABC',
      statement : 'CREATE TABLE IF NOT EXISTS T1PAR ( ak int );',
      parallel : 1,
      terminate_nr : 1
    }
  ];
  runner.startRun(cfgdata, input, testpool, { fnout : 'test_out.txt' } , function() {
    console.log('INVOKING CALLBACK');

    var log = '' + fs.readFileSync('test_out.txt');
    test.deepEqual(log.indexOf('ABC') >= 0, true);
    console.log('COMPARED');
    //test.done();
  } );
});