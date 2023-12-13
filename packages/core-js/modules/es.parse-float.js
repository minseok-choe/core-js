'use strict';
var $ = require('../internals/export');
var global = require('../internals/global');
var fails = require('../internals/fails');
var toString = require('../internals/to-string');
var trim = require('../internals/string-trim').trim;
var whitespaces = require('../internals/whitespaces');

var $parseFloat = global.parseFloat;
var Symbol = global.Symbol;
var ITERATOR = Symbol && Symbol.iterator;
var FORCED = 1 / $parseFloat(whitespaces + '-0') !== -Infinity
  // MS Edge 18- broken with boxed symbols
  || (ITERATOR && !fails(function () { $parseFloat(Object(ITERATOR)); }));

// `parseFloat` method
// https://tc39.es/ecma262/#sec-parsefloat-string
$({ global: true, forced: FORCED }, {
  parseFloat: function parseFloat(string) {
    var trimmedString = trim(toString(string));
    var result = $parseFloat(trimmedString);
    return result === 0 && trimmedString[0] === '-' ? -0 : result;
  },
});
