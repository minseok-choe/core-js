'use strict';
var global = require('../internals/global');
var isCallable = require('../internals/is-callable');
var isObject = require('../internals/is-object');
var hasOwn = require('../internals/has-own-property');
var classof = require('../internals/classof');
var defineBuiltInAccessor = require('../internals/define-built-in-accessor');
var setPrototypeOf = require('../internals/object-set-prototype-of');
var wellKnownSymbol = require('../internals/well-known-symbol');
var InternalStateModule = require('../internals/internal-state');
var TypedArrayConstructors = require('../internals/typed-array-constructors');

var enforceInternalState = InternalStateModule.enforce;
var getInternalState = InternalStateModule.get;
var getPrototypeOf = Object.getPrototypeOf;
var TypedArray = getPrototypeOf(Int8Array);
var TypedArrayPrototype = getPrototypeOf(Int8Array.prototype);
var Uint8ClampedArrayPrototype = Uint8ClampedArray.prototype;
var TypeError = global.TypeError;

var TO_STRING_TAG = wellKnownSymbol('toStringTag');
var NAME, Constructor, Prototype;

var isTypedArray = function (it) {
  return isObject(it) ? hasOwn(TypedArrayConstructors, classof(it)) : false;
};

var aTypedArray = function (it) {
  if (isTypedArray(it)) return it;
  throw new TypeError('Target is not a typed array');
};

var getTypedArrayMetadata = function (it, key) {
  var proto = getPrototypeOf(it);
  if (!isObject(proto)) return;
  var state = getInternalState(proto);
  return (state && hasOwn(state, key)) ? state[key] : getTypedArrayMetadata(proto, key);
};

for (NAME in TypedArrayConstructors) {
  Constructor = global[NAME];
  Prototype = Constructor && Constructor.prototype;
  if (Prototype) {
    var state = enforceInternalState(Prototype);
    state.TypedArrayConstructor = Constructor;
    state.TypedArrayTag = NAME;
  }
}

// WebKit bug - typed arrays constructors prototype is Object.prototype
if (!isCallable(TypedArray) || TypedArray === Function.prototype) {
  // eslint-disable-next-line no-shadow -- safe
  TypedArray = function TypedArray() {
    throw new TypeError('Incorrect invocation');
  };
  for (NAME in TypedArrayConstructors) {
    if (global[NAME]) setPrototypeOf(global[NAME], TypedArray);
  }
}

if (!TypedArrayPrototype || TypedArrayPrototype === Object.prototype) {
  TypedArrayPrototype = TypedArray.prototype;
  for (NAME in TypedArrayConstructors) {
    if (global[NAME]) setPrototypeOf(global[NAME].prototype, TypedArrayPrototype);
  }
}

// WebKit bug - one more object in Uint8ClampedArray prototype chain
if (getPrototypeOf(Uint8ClampedArrayPrototype) !== TypedArrayPrototype) {
  setPrototypeOf(Uint8ClampedArrayPrototype, TypedArrayPrototype);
}

if (!hasOwn(TypedArrayPrototype, TO_STRING_TAG)) {
  defineBuiltInAccessor(TypedArrayPrototype, TO_STRING_TAG, {
    configurable: true,
    get: function () {
      if (isObject(this)) return getTypedArrayMetadata(this, 'TypedArrayTag');
    },
  });
}

module.exports = {
  aTypedArray: aTypedArray,
  isTypedArray: isTypedArray,
  TypedArray: TypedArray,
  TypedArrayPrototype: TypedArrayPrototype,
  getTypedArrayMetadata: getTypedArrayMetadata,
};
