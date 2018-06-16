'use strict';
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
  console.log('adding stuff now');
  jinst.addOption('-Xrs');
  var root = `${__dirname}/../../`;
  jinst.setupClasspath([
    // path to vora jdbc driver
    root + './drivers/acmereports.jar'
  ]);
}

var config = (function () {
  return {
    libpath : './drivers/hl-jdbc-2.3.90.jar',
    drivername : 'com.sap.vora.jdbc.VoraDriver',
    url : 'jdbc:hanalite://' + '127.0.0.1:2202',
    //url : 'jdbc:hanalite://' + '127.0.0.1:2202' + '/?resultFormat=binary',
    user : '',
    logging : 'info',
    password: '',
    minpoolsize: 2,
    maxpoolsize: 500
  };
}
)();

exports.config_vora = config;