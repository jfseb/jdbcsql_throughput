'use strict';

var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
  console.log('adding stuff now');
  jinst.addOption('-Xrs');
  var root = __dirname + '/../../'; // eslint-disable-line
  jinst.setupClasspath([root + './drivers/hsqldb.jar', root + './drivers/derby.jar', root + './drivers/hl-jdbc-2.3.90.jar', root + './drivers/derbyclient.jar', root + './drivers/derbytools.jar']);
}

var config = function () {
  return {
    url: 'jdbc:hsqldb:hsql://localhost/xdb',
    user: 'SA',
    logging: 'info',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 50
    //  properties : {user: '', password : ''}
  };
}();

exports.config = config;