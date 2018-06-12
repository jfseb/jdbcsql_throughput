

var root = (process.env.FSD_COVERAGE) ? './gen_cov' : './gen';

var debug = require('debug');
const debuglog = debug('main');

var Pool = require('jdbc');
const SQLExec = require(root + '/sqlexec/sqlexec.js');

// Module to control application life.
const runner = require(root + '/sqlexec/averages.js')
// Module to create native browser window.

var Pool = require('jdbc');

var config = new SQLExec.SQLExec().config;
console.log('config' + JSON.stringify(config));

var testpool = new Pool(config);
var executor = new SQLExec.SQLExec().makeRunner(testpool);

var hndl = runner.startOpSequential('CREATE TABLE IF NOT EXISTS T11 ( id int primary key, abc varchar(10));');


for(var i = 0; i < 1500; ++i) {
 hndl = runner.startOpSequential('INSERT INTO T11 (id, abc) values (' + ( i + 900 + Date.now() % 10000000)  + ', \'zy' + i +' sf\');');
}

var handle = runner.startOpRepeat('SELECT MAX(ABC), COUNT(*) FROM T11 where ID > 3030;', 40);

//var handle = runner.startOpRepeat('SELECT COUNT(*) FROM T1;', 20);

runner.loopIt(executor);

setTimeout( function() {
  console.log('stopping now');
  runner.stopOp(handle);
}, 10000);


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
