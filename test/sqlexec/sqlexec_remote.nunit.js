var process = require('process');
var root = (process.env.FSD_COVERAGE) ? '../../gen_cov' : '../../gen';
// var _ = require('lodash');
// var debuglog = require('debug')('plainRecoginizer.nunit')

//var debug = require('debug');
//const debuglog = debug('sqlexec.nunit');

var t = require('tap');
// strongly recommended to load this first, as it brings up the jvm,
// setting classpath variables!

console.log(root);
const configFileName = 'gen/configs/config_derby.js';

const config = require(root + '/configs/config_derby.js');

const SQLExec = require(root + '/sqlexec/sqlexec_remote.js');

console.log('config' + JSON.stringify(config));
// var HTMLConnector = require(root + '/ui/htmlconnector.js')
// const SmartDialog = require(root + '/bot/smartdialog.js')


t.test('testForkAndStop' , function(childTest) {
  // setup the forks
  // setup the forks
  childTest.plan(2);
  console.log('config' + JSON.stringify(config));
  var forks = new SQLExec.Forks(3);
  childTest.equal(forks.getForksCount(), 3);
  setTimeout( ()=> {
    forks.stop();
    childTest.equal(forks.getForksCount(), 0);
    childTest.end();
  }, 1000);
});


t.test('testNotExistTable' , function(childTest) {
  // setup the forks
  childTest.plan(2);
  console.log('config' + JSON.stringify(config));
  var forks = new SQLExec.Forks(1);
  var executor = new SQLExec.SQLExecRemote();
  var fork = forks.getFork(0);
  var sqlexec = executor.makeRunner(fork);
  var s4 = 'SELECT * FROM T1NOTTHERE;';
  var u = forks.getForksCount();
  t.deepEqual(1, u);
  t.deepEqual(1, forks.getForksCount(), 'nr forks');
  sqlexec.execStatement(s4).then( function(T)
  {
    console.log(JSON.stringify(T));
    forks.stop();
    childTest.deepEqual(false, undefined);
    childTest.end();
    //test.done();
  }).catch(function(err) {
    console.log('here err: ' + err + JSON.stringify(err) + ' typof ' + typeof err + err.toString() );
    forks.stop();
    childTest.deepEqual(!!( ('' + err).indexOf('T1NOTTHERE') > 0), true);
    childTest.deepEqual(err, err);
    childTest.end();
  });

});


t.test('testSelect' , function(test) {
  //test.plan(1);
  test.plan(1);
  console.log('config' + JSON.stringify(config));
  var exeRemote = new SQLExec.SQLExecRemote();
  var forks = new SQLExec.Forks(1);
  var fork = forks.getFork(0);
  var executor = exeRemote.makeRunner(fork);
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
    forks.stop();
    test.end();
  }).catch(function(err) {
    console.log(err);
    test.deepEqual(err, 'should not get here', 'rejection');
    forks.stop();
    test.end();
  });
  /*
  var waitTime = function () {
    if(forks.getForksCount() > 0) {
      setTimeout(waitTime, 100);
    }
  };
  setTimeout(waitTime, 1000);
  */
});

