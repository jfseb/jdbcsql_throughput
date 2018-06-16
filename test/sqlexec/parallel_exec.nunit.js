var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../gen';
// var _ = require('lodash');
// var debuglog = require('debug')('plainRecoginizer.nunit')

//var debug = require('debug');
//const debuglog = debug('sqlexec.nunit');

var tap = require('tap');
// strongly recommended to load this first, as it brings up the jvm,
// setting classpath variables!
console.log(root);

//const configFileName = 'gen/configs/config_derby.js';


// strongly recommended to load this first, as it brings up the jvm,
// setting classpath variables!
const config = require(root + '/configs/config_derby.js').config;

const ParallelPool = require(root + '/sqlexec/parallel_pool.js').ParallelPool;

//const SQLExec = require(root + '/sqlexec/sqlexec_remote.js');

console.log('config' + JSON.stringify(config));

var Pool = require('jdbc');
const SQLExec = require(root + '/sqlexec/sqlexec.js');

console.log('config' + JSON.stringify(config));

console.log('config' + JSON.stringify(config));
var testpool; // = new Pool(config);
var executor; // = new SQLExec.SQLExec();
var ParallelExec = require(root + '/sqlexec/parallel_exec.js').ParallelExec;

var Status = require(root + '/constants.js').Status;

var parallel_exec = undefined;
var parpool = undefined;

function setup(tap) {
  tap.test('setup', test => {
    testpool = new Pool(config);
    executor = new SQLExec.SQLExec();

    parpool = new ParallelPool(4, testpool, config, undefined );

    test.plan(1);
    console.log('config' + JSON.stringify(config));
    var executor = executor.makeRunner(testpool);
    var s1 = 'CREATE TABLE IF NOT EXISTS T1 ( id int primary key, abc varchar(10));';
    var s1d = 'DELETE FROM T1;';
    var s2a = 'INSERT INTO T1 (id, abc) values (1, \'def\');';
    var s2b = 'INSERT INTO T1 (id, abc) values (2, \'hij\');';
    var s3 = 'DELETE FROM T1;';
    var s4 = 'SELECT * FROM T1;';
    executor.execStatement(s1).then( function(T)
    {
      return executor.execStatement(s1d);
    }).then(function (T) {
      return executor.execStatement(s3);
    }).then(function (T) {
      return executor.execStatement(s2a);
    }).then(function (T) {
      return executor.execStatement(s2b);
    }).then(function(T) {
      return executor.execStatement(s4);
    }).then(function(R) {
      console.log(' here result:' + JSON.stringify(R.result,undefined,2));
      test.deepEqual(R.result.length, 2);
      test.end();
    }).catch(function(err) {
      console.log(err);
      test.deepEqual(err, 'should not get here', 'rejection');
      test.end();
    });
  });
}

function tearDown(t) {
  tap.test('teardown', t => {
    testpool = undefined;
    executor = undefined;
    t.end(); });
}

setup(tap);


tap.test('testParallelExecWithCountTerminate' , function(test) {
  test.plan(15);

  parpool = new ParallelPool(4, testpool, config, undefined );
  parallel_exec = new ParallelExec(parpool.getExecutors());
  console.log('config' + JSON.stringify(config));
  var received = 0;
  function cbProgress(op) {
    // here we still are part of the handles

    if(received < 10) {

    }
    ++received;
    test.deepEqual(op.metrics.count_total, received, 'test count');
  }
  var handle = parallel_exec.startOpRepeat( 'ATAG',
  'SELECT * FROM T1;',
  3,
    { continuous : true,
      terminate_nr : 10 },
    {
      progress : cbProgress,
      done : function(op)
      {
        test.deepEqual(op.status, Status.STOPPED, 'status');
        test.deepEqual(parallel_exec.getOp(handle), undefined,'handle removed');
        test.deepEqual(received, 10, 'correct received invocations');
        test.deepEqual(op.metrics.count_total, 10, 'correct nr');
        test.deepEqual(op.metrics.count_started, 10, 'correct nr');
        test.done();
      }
    });
});


tearDown(tap);
