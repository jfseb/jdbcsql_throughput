
var root = '../gen';
var t = require('tap');

const config = require(root + '/configs/config_derby.js');
const SQLExec = require(root + '/sqlexec_remote.js');

const Averages = require('../gen/averages.js');


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



