//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` (`self`) in the browser, or `global` on the server.
  // We use `self` instead of `window` for `WebWorker` support.
  var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global;

  // Save the previous value of the `_` variable.
  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype;

  // Create quick reference variables for speed access to core prototypes.
  var
    push = ArrayProto.push,
    slice = ArrayProto.slice,
    toString = ObjProto.toString,
    hasOwnProperty = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray = Array.isArray,
    nativeKeys = Object.keys,
    nativeCreate = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for their old module API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };

  // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
  // This accumulates the arguments passed into an array, after a given index.
  var restArgs = function(func, startIndex) {
    startIndex = startIndex == null ? func.length - 1 : +startIndex;
    return function() {
      var length = Math.max(arguments.length - startIndex, 0);
      var rest = Array(length);
      var index;
      for (index = 0; index < length; index++) {
        rest[index] = arguments[index + startIndex];
      }
      switch (startIndex) {
        case 0: return func.call(this, rest);
        case 1: return func.call(this, arguments[0], rest);
        case 2: return func.call(this, arguments[0], arguments[1], rest);
      }
      var args = Array(startIndex + 1);
      for (index = 0; index < startIndex; index++) {
        args[index] = arguments[index];
      }
      args[startIndex] = rest;
      return func.apply(this, args);
    };
  };

  // An internal function for creating a new object that inherits from another.
  var baseCreate = function(prototype) {
    if (!_.isObject(prototype)) return {};
    if (nativeCreate) return nativeCreate(prototype);
    Ctor.prototype = prototype;
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };

  var property = function(key) {
    return function(obj) {
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;
  var getLength = property('length');
  var isArrayLike = function(collection) {
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  // Collection Functions
  // --------------------

  // The cornerstone, an `each` implementation, aka `forEach`.
  // Handles raw objects in addition to array-likes. Treats all
  // sparse array-likes as if they were dense.
  _.each = _.forEach = function(obj, iteratee, context) {
    iteratee = optimizeCb(iteratee, context);
    var i, length;
    if (isArrayLike(obj)) {
      for (i = 0, length = obj.length; i < length; i++) {
        iteratee(obj[i], i, obj);
      }
    } else {
      var keys = _.keys(obj);
      for (i = 0, length = keys.length; i < length; i++) {
        iteratee(obj[keys[i]], keys[i], obj);
      }
    }
    return obj;
  };

  // Return the results of applying the iteratee to each element.
  _.map = _.collect = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length,
        results = Array(length);
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      results[index] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Create a reducing function iterating left or right.
  var createReduce = function(dir) {
    // Optimized iterator function as using arguments.length
    // in the main function will deoptimize the, see #1991.
    var reducer = function(obj, iteratee, memo, initial) {
      var keys = !isArrayLike(obj) && _.keys(obj),
          length = (keys || obj).length,
          index = dir > 0 ? 0 : length - 1;
      if (!initial) {
        memo = obj[keys ? keys[index] : index];
        index += dir;
      }
      for (; index >= 0 && index < length; index += dir) {
        var currentKey = keys ? keys[index] : index;
        memo = iteratee(memo, obj[currentKey], currentKey, obj);
      }
      return memo;
    };

    return function(obj, iteratee, memo, context) {
      var initial = arguments.length >= 3;
      return reducer(obj, optimizeCb(iteratee, context, 4), memo, initial);
    };
  };

  // **Reduce** builds up a single result from a list of values, aka `inject`,
  // or `foldl`.
  _.reduce = _.foldl = _.inject = createReduce(1);

  // The right-associative version of reduce, also known as `foldr`.
  _.reduceRight = _.foldr = createReduce(-1);

  // Return the first value which passes a truth test. Aliased as `detect`.
  _.find = _.detect = function(obj, predicate, context) {
    var key;
    if (isArrayLike(obj)) {
      key = _.findIndex(obj, predicate, context);
    } else {
      key = _.findKey(obj, predicate, context);
    }
    if (key !== void 0 && key !== -1) return obj[key];
  };

  // Return all the elements that pass a truth test.
  // Aliased as `select`.
  _.filter = _.select = function(obj, predicate, context) {
    var results = [];
    predicate = cb(predicate, context);
    _.each(obj, function(value, index, list) {
      if (predicate(value, index, list)) results.push(value);
    });
    return results;
  };

  // Return all the elements for which a truth test fails.
  _.reject = function(obj, predicate, context) {
    return _.filter(obj, _.negate(cb(predicate)), context);
  };

  // Determine whether all of the elements match a truth test.
  // Aliased as `all`.
  _.every = _.all = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (!predicate(obj[currentKey], currentKey, obj)) return false;
    }
    return true;
  };

  // Determine if at least one element in the object matches a truth test.
  // Aliased as `any`.
  _.some = _.any = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = !isArrayLike(obj) && _.keys(obj),
        length = (keys || obj).length;
    for (var index = 0; index < length; index++) {
      var currentKey = keys ? keys[index] : index;
      if (predicate(obj[currentKey], currentKey, obj)) return true;
    }
    return false;
  };

  // Determine if the array or object contains a given item (using `===`).
  // Aliased as `includes` and `include`.
  _.contains = _.includes = _.include = function(obj, item, fromIndex, guard) {
    if (!isArrayLike(obj)) obj = _.values(obj);
    if (typeof fromIndex != 'number' || guard) fromIndex = 0;
    return _.indexOf(obj, item, fromIndex) >= 0;
  };

  // Invoke a method (with arguments) on every item in a collection.
  _.invoke = restArgs(function(obj, method, args) {
    var isFunc = _.isFunction(method);
    return _.map(obj, function(value) {
      var func = isFunc ? method : value[method];
      return func == null ? func : func.apply(value, args);
    });
  });

  // Convenience version of a common use case of `map`: fetching a property.
  _.pluck = function(obj, key) {
    return _.map(obj, _.property(key));
  };

  // Convenience version of a common use case of `filter`: selecting only objects
  // containing specific `key:value` pairs.
  _.where = function(obj, attrs) {
    return _.filter(obj, _.matcher(attrs));
  };

  // Convenience version of a common use case of `find`: getting the first object
  // containing specific `key:value` pairs.
  _.findWhere = function(obj, attrs) {
    return _.find(obj, _.matcher(attrs));
  };

  // Return the maximum element (or element-based computation).
  _.max = function(obj, iteratee, context) {
    var result = -Infinity, lastComputed = -Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value > result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed > lastComputed || computed === -Infinity && result === -Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Return the minimum element (or element-based computation).
  _.min = function(obj, iteratee, context) {
    var result = Infinity, lastComputed = Infinity,
        value, computed;
    if (iteratee == null && obj != null) {
      obj = isArrayLike(obj) ? obj : _.values(obj);
      for (var i = 0, length = obj.length; i < length; i++) {
        value = obj[i];
        if (value < result) {
          result = value;
        }
      }
    } else {
      iteratee = cb(iteratee, context);
      _.each(obj, function(v, index, list) {
        computed = iteratee(v, index, list);
        if (computed < lastComputed || computed === Infinity && result === Infinity) {
          result = v;
          lastComputed = computed;
        }
      });
    }
    return result;
  };

  // Shuffle a collection.
  _.shuffle = function(obj) {
    return _.sample(obj, Infinity);
  };

  // Sample **n** random values from a collection using the modern version of the
  // [Fisher-Yates shuffle](http://en.wikipedia.org/wiki/Fisher–Yates_shuffle).
  // If **n** is not specified, returns a single random element.
  // The internal `guard` argument allows it to work with `map`.
  _.sample = function(obj, n, guard) {
    if (n == null || guard) {
      if (!isArrayLike(obj)) obj = _.values(obj);
      return obj[_.random(obj.length - 1)];
    }
    var sample = isArrayLike(obj) ? _.clone(obj) : _.values(obj);
    var length = getLength(sample);
    n = Math.max(Math.min(n, length), 0);
    var last = length - 1;
    for (var index = 0; index < n; index++) {
      var rand = _.random(index, last);
      var temp = sample[index];
      sample[index] = sample[rand];
      sample[rand] = temp;
    }
    return sample.slice(0, n);
  };

  // Sort the object's values by a criterion produced by an iteratee.
  _.sortBy = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    return _.pluck(_.map(obj, function(value, index, list) {
      return {
        value: value,
        index: index,
        criteria: iteratee(value, index, list)
      };
    }).sort(function(left, right) {
      var a = left.criteria;
      var b = right.criteria;
      if (a !== b) {
        if (a > b || a === void 0) return 1;
        if (a < b || b === void 0) return -1;
      }
      return left.index - right.index;
    }), 'value');
  };

  // An internal function used for aggregate "group by" operations.
  var group = function(behavior, partition) {
    return function(obj, iteratee, context) {
      var result = partition ? [[], []] : {};
      iteratee = cb(iteratee, context);
      _.each(obj, function(value, index) {
        var key = iteratee(value, index, obj);
        behavior(result, value, key);
      });
      return result;
    };
  };

  // Groups the object's values by a criterion. Pass either a string attribute
  // to group by, or a function that returns the criterion.
  _.groupBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key].push(value); else result[key] = [value];
  });

  // Indexes the object's values by a criterion, similar to `groupBy`, but for
  // when you know that your index values will be unique.
  _.indexBy = group(function(result, value, key) {
    result[key] = value;
  });

  // Counts instances of an object that group by a certain criterion. Pass
  // either a string attribute to count by, or a function that returns the
  // criterion.
  _.countBy = group(function(result, value, key) {
    if (_.has(result, key)) result[key]++; else result[key] = 1;
  });

  // Safely create a real, live array from anything iterable.
  _.toArray = function(obj) {
    if (!obj) return [];
    if (_.isArray(obj)) return slice.call(obj);
    if (isArrayLike(obj)) return _.map(obj, _.identity);
    return _.values(obj);
  };

  // Return the number of elements in an object.
  _.size = function(obj) {
    if (obj == null) return 0;
    return isArrayLike(obj) ? obj.length : _.keys(obj).length;
  };

  // Split a collection into two arrays: one whose elements all satisfy the given
  // predicate, and one whose elements all do not satisfy the predicate.
  _.partition = group(function(result, value, pass) {
    result[pass ? 0 : 1].push(value);
  }, true);

  // Array Functions
  // ---------------

  // Get the first element of an array. Passing **n** will return the first N
  // values in the array. Aliased as `head` and `take`. The **guard** check
  // allows it to work with `_.map`.
  _.first = _.head = _.take = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[0];
    return _.initial(array, array.length - n);
  };

  // Returns everything but the last entry of the array. Especially useful on
  // the arguments object. Passing **n** will return all the values in
  // the array, excluding the last N.
  _.initial = function(array, n, guard) {
    return slice.call(array, 0, Math.max(0, array.length - (n == null || guard ? 1 : n)));
  };

  // Get the last element of an array. Passing **n** will return the last N
  // values in the array.
  _.last = function(array, n, guard) {
    if (array == null) return void 0;
    if (n == null || guard) return array[array.length - 1];
    return _.rest(array, Math.max(0, array.length - n));
  };

  // Returns everything but the first entry of the array. Aliased as `tail` and `drop`.
  // Especially useful on the arguments object. Passing an **n** will return
  // the rest N values in the array.
  _.rest = _.tail = _.drop = function(array, n, guard) {
    return slice.call(array, n == null || guard ? 1 : n);
  };

  // Trim out all falsy values from an array.
  _.compact = function(array) {
    return _.filter(array, _.identity);
  };

  // Internal implementation of a recursive `flatten` function.
  var flatten = function(input, shallow, strict, output) {
    output = output || [];
    var idx = output.length;
    for (var i = 0, length = getLength(input); i < length; i++) {
      var value = input[i];
      if (isArrayLike(value) && (_.isArray(value) || _.isArguments(value))) {
        //flatten current level of array or arguments object
        if (shallow) {
          var j = 0, len = value.length;
          while (j < len) output[idx++] = value[j++];
        } else {
          flatten(value, shallow, strict, output);
          idx = output.length;
        }
      } else if (!strict) {
        output[idx++] = value;
      }
    }
    return output;
  };

  // Flatten out an array, either recursively (by default), or just one level.
  _.flatten = function(array, shallow) {
    return flatten(array, shallow, false);
  };

  // Return a version of the array that does not contain the specified value(s).
  _.without = restArgs(function(array, otherArrays) {
    return _.difference(array, otherArrays);
  });

  // Produce a duplicate-free version of the array. If the array has already
  // been sorted, you have the option of using a faster algorithm.
  // Aliased as `unique`.
  _.uniq = _.unique = function(array, isSorted, iteratee, context) {
    if (!_.isBoolean(isSorted)) {
      context = iteratee;
      iteratee = isSorted;
      isSorted = false;
    }
    if (iteratee != null) iteratee = cb(iteratee, context);
    var result = [];
    var seen = [];
    for (var i = 0, length = getLength(array); i < length; i++) {
      var value = array[i],
          computed = iteratee ? iteratee(value, i, array) : value;
      if (isSorted) {
        if (!i || seen !== computed) result.push(value);
        seen = computed;
      } else if (iteratee) {
        if (!_.contains(seen, computed)) {
          seen.push(computed);
          result.push(value);
        }
      } else if (!_.contains(result, value)) {
        result.push(value);
      }
    }
    return result;
  };

  // Produce an array that contains the union: each distinct element from all of
  // the passed-in arrays.
  _.union = restArgs(function(arrays) {
    return _.uniq(flatten(arrays, true, true));
  });

  // Produce an array that contains every item shared between all the
  // passed-in arrays.
  _.intersection = function(array) {
    var result = [];
    var argsLength = arguments.length;
    for (var i = 0, length = getLength(array); i < length; i++) {
      var item = array[i];
      if (_.contains(result, item)) continue;
      var j;
      for (j = 1; j < argsLength; j++) {
        if (!_.contains(arguments[j], item)) break;
      }
      if (j === argsLength) result.push(item);
    }
    return result;
  };

  // Take the difference between one array and a number of other arrays.
  // Only the elements present in just the first array will remain.
  _.difference = restArgs(function(array, rest) {
    rest = flatten(rest, true, true);
    return _.filter(array, function(value){
      return !_.contains(rest, value);
    });
  });

  // Complement of _.zip. Unzip accepts an array of arrays and groups
  // each array's elements on shared indices
  _.unzip = function(array) {
    var length = array && _.max(array, getLength).length || 0;
    var result = Array(length);

    for (var index = 0; index < length; index++) {
      result[index] = _.pluck(array, index);
    }
    return result;
  };

  // Zip together multiple lists into a single array -- elements that share
  // an index go together.
  _.zip = restArgs(_.unzip);

  // Converts lists into objects. Pass either a single array of `[key, value]`
  // pairs, or two parallel arrays of the same length -- one of keys, and one of
  // the corresponding values.
  _.object = function(list, values) {
    var result = {};
    for (var i = 0, length = getLength(list); i < length; i++) {
      if (values) {
        result[list[i]] = values[i];
      } else {
        result[list[i][0]] = list[i][1];
      }
    }
    return result;
  };

  // Generator function to create the findIndex and findLastIndex functions
  var createPredicateIndexFinder = function(dir) {
    return function(array, predicate, context) {
      predicate = cb(predicate, context);
      var length = getLength(array);
      var index = dir > 0 ? 0 : length - 1;
      for (; index >= 0 && index < length; index += dir) {
        if (predicate(array[index], index, array)) return index;
      }
      return -1;
    };
  };

  // Returns the first index on an array-like that passes a predicate test
  _.findIndex = createPredicateIndexFinder(1);
  _.findLastIndex = createPredicateIndexFinder(-1);

  // Use a comparator function to figure out the smallest index at which
  // an object should be inserted so as to maintain order. Uses binary search.
  _.sortedIndex = function(array, obj, iteratee, context) {
    iteratee = cb(iteratee, context, 1);
    var value = iteratee(obj);
    var low = 0, high = getLength(array);
    while (low < high) {
      var mid = Math.floor((low + high) / 2);
      if (iteratee(array[mid]) < value) low = mid + 1; else high = mid;
    }
    return low;
  };

  // Generator function to create the indexOf and lastIndexOf functions
  var createIndexFinder = function(dir, predicateFind, sortedIndex) {
    return function(array, item, idx) {
      var i = 0, length = getLength(array);
      if (typeof idx == 'number') {
        if (dir > 0) {
          i = idx >= 0 ? idx : Math.max(idx + length, i);
        } else {
          length = idx >= 0 ? Math.min(idx + 1, length) : idx + length + 1;
        }
      } else if (sortedIndex && idx && length) {
        idx = sortedIndex(array, item);
        return array[idx] === item ? idx : -1;
      }
      if (item !== item) {
        idx = predicateFind(slice.call(array, i, length), _.isNaN);
        return idx >= 0 ? idx + i : -1;
      }
      for (idx = dir > 0 ? i : length - 1; idx >= 0 && idx < length; idx += dir) {
        if (array[idx] === item) return idx;
      }
      return -1;
    };
  };

  // Return the position of the first occurrence of an item in an array,
  // or -1 if the item is not included in the array.
  // If the array is large and already in sort order, pass `true`
  // for **isSorted** to use binary search.
  _.indexOf = createIndexFinder(1, _.findIndex, _.sortedIndex);
  _.lastIndexOf = createIndexFinder(-1, _.findLastIndex);

  // Generate an integer Array containing an arithmetic progression. A port of
  // the native Python `range()` function. See
  // [the Python documentation](http://docs.python.org/library/functions.html#range).
  _.range = function(start, stop, step) {
    if (stop == null) {
      stop = start || 0;
      start = 0;
    }
    step = step || 1;

    var length = Math.max(Math.ceil((stop - start) / step), 0);
    var range = Array(length);

    for (var idx = 0; idx < length; idx++, start += step) {
      range[idx] = start;
    }

    return range;
  };

  // Function (ahem) Functions
  // ------------------

  // Determines whether to execute a function as a constructor
  // or a normal function with the provided arguments
  var executeBound = function(sourceFunc, boundFunc, context, callingContext, args) {
    if (!(callingContext instanceof boundFunc)) return sourceFunc.apply(context, args);
    var self = baseCreate(sourceFunc.prototype);
    var result = sourceFunc.apply(self, args);
    if (_.isObject(result)) return result;
    return self;
  };

  // Create a function bound to a given object (assigning `this`, and arguments,
  // optionally). Delegates to **ECMAScript 5**'s native `Function.bind` if
  // available.
  _.bind = restArgs(function(func, context, args) {
    if (!_.isFunction(func)) throw new TypeError('Bind must be called on a function');
    var bound = restArgs(function(callArgs) {
      return executeBound(func, bound, context, this, args.concat(callArgs));
    });
    return bound;
  });

  // Partially apply a function by creating a version that has had some of its
  // arguments pre-filled, without changing its dynamic `this` context. _ acts
  // as a placeholder by default, allowing any combination of arguments to be
  // pre-filled. Set `_.partial.placeholder` for a custom placeholder argument.
  _.partial = restArgs(function(func, boundArgs) {
    var placeholder = _.partial.placeholder;
    var bound = function() {
      var position = 0, length = boundArgs.length;
      var args = Array(length);
      for (var i = 0; i < length; i++) {
        args[i] = boundArgs[i] === placeholder ? arguments[position++] : boundArgs[i];
      }
      while (position < arguments.length) args.push(arguments[position++]);
      return executeBound(func, bound, this, this, args);
    };
    return bound;
  });

  _.partial.placeholder = _;

  // Bind a number of an object's methods to that object. Remaining arguments
  // are the method names to be bound. Useful for ensuring that all callbacks
  // defined on an object belong to it.
  _.bindAll = restArgs(function(obj, keys) {
    keys = flatten(keys, false, false);
    var index = keys.length;
    if (index < 1) throw new Error('bindAll must be passed function names');
    while (index--) {
      var key = keys[index];
      obj[key] = _.bind(obj[key], obj);
    }
  });

  // Memoize an expensive function by storing its results.
  _.memoize = function(func, hasher) {
    var memoize = function(key) {
      var cache = memoize.cache;
      var address = '' + (hasher ? hasher.apply(this, arguments) : key);
      if (!_.has(cache, address)) cache[address] = func.apply(this, arguments);
      return cache[address];
    };
    memoize.cache = {};
    return memoize;
  };

  // Delays a function for the given number of milliseconds, and then calls
  // it with the arguments supplied.
  _.delay = restArgs(function(func, wait, args) {
    return setTimeout(function(){
      return func.apply(null, args);
    }, wait);
  });

  // Defers a function, scheduling it to run after the current call stack has
  // cleared.
  _.defer = _.partial(_.delay, _, 1);

  // Returns a function, that, when invoked, will only be triggered at most once
  // during a given window of time. Normally, the throttled function will run
  // as much as it can, without ever going more than once per `wait` duration;
  // but if you'd like to disable the execution on the leading edge, pass
  // `{leading: false}`. To disable execution on the trailing edge, ditto.
  _.throttle = function(func, wait, options) {
    var context, args, result;
    var timeout = null;
    var previous = 0;
    if (!options) options = {};
    var later = function() {
      previous = options.leading === false ? 0 : _.now();
      timeout = null;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    };
    return function() {
      var now = _.now();
      if (!previous && options.leading === false) previous = now;
      var remaining = wait - (now - previous);
      context = this;
      args = arguments;
      if (remaining <= 0 || remaining > wait) {
        if (timeout) {
          clearTimeout(timeout);
          timeout = null;
        }
        previous = now;
        result = func.apply(context, args);
        if (!timeout) context = args = null;
      } else if (!timeout && options.trailing !== false) {
        timeout = setTimeout(later, remaining);
      }
      return result;
    };
  };

  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  _.debounce = function(func, wait, immediate) {
    var timeout, args, context, timestamp, result;

    var later = function() {
      var last = _.now() - timestamp;

      if (last < wait && last >= 0) {
        timeout = setTimeout(later, wait - last);
      } else {
        timeout = null;
        if (!immediate) {
          result = func.apply(context, args);
          if (!timeout) context = args = null;
        }
      }
    };

    return function() {
      context = this;
      args = arguments;
      timestamp = _.now();
      var callNow = immediate && !timeout;
      if (!timeout) timeout = setTimeout(later, wait);
      if (callNow) {
        result = func.apply(context, args);
        context = args = null;
      }

      return result;
    };
  };

  // Returns the first function passed as an argument to the second,
  // allowing you to adjust arguments, run code before and after, and
  // conditionally execute the original function.
  _.wrap = function(func, wrapper) {
    return _.partial(wrapper, func);
  };

  // Returns a negated version of the passed-in predicate.
  _.negate = function(predicate) {
    return function() {
      return !predicate.apply(this, arguments);
    };
  };

  // Returns a function that is the composition of a list of functions, each
  // consuming the return value of the function that follows.
  _.compose = function() {
    var args = arguments;
    var start = args.length - 1;
    return function() {
      var i = start;
      var result = args[start].apply(this, arguments);
      while (i--) result = args[i].call(this, result);
      return result;
    };
  };

  // Returns a function that will only be executed on and after the Nth call.
  _.after = function(times, func) {
    return function() {
      if (--times < 1) {
        return func.apply(this, arguments);
      }
    };
  };

  // Returns a function that will only be executed up to (but not including) the Nth call.
  _.before = function(times, func) {
    var memo;
    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      }
      if (times <= 1) func = null;
      return memo;
    };
  };

  // Returns a function that will be executed at most one time, no matter how
  // often you call it. Useful for lazy initialization.
  _.once = _.partial(_.before, 2);

  _.restArgs = restArgs;

  // Object Functions
  // ----------------

  // Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
  var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
  var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                      'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

  var collectNonEnumProps = function(obj, keys) {
    var nonEnumIdx = nonEnumerableProps.length;
    var constructor = obj.constructor;
    var proto = _.isFunction(constructor) && constructor.prototype || ObjProto;

    // Constructor is a special case.
    var prop = 'constructor';
    if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

    while (nonEnumIdx--) {
      prop = nonEnumerableProps[nonEnumIdx];
      if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
        keys.push(prop);
      }
    }
  };

  // Retrieve the names of an object's own properties.
  // Delegates to **ECMAScript 5**'s native `Object.keys`
  _.keys = function(obj) {
    if (!_.isObject(obj)) return [];
    if (nativeKeys) return nativeKeys(obj);
    var keys = [];
    for (var key in obj) if (_.has(obj, key)) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve all the property names of an object.
  _.allKeys = function(obj) {
    if (!_.isObject(obj)) return [];
    var keys = [];
    for (var key in obj) keys.push(key);
    // Ahem, IE < 9.
    if (hasEnumBug) collectNonEnumProps(obj, keys);
    return keys;
  };

  // Retrieve the values of an object's properties.
  _.values = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var values = Array(length);
    for (var i = 0; i < length; i++) {
      values[i] = obj[keys[i]];
    }
    return values;
  };

  // Returns the results of applying the iteratee to each element of the object
  // In contrast to _.map it returns an object
  _.mapObject = function(obj, iteratee, context) {
    iteratee = cb(iteratee, context);
    var keys = _.keys(obj),
      length = keys.length,
      results = {};
    for (var index = 0; index < length; index++) {
      var currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
  };

  // Convert an object into a list of `[key, value]` pairs.
  _.pairs = function(obj) {
    var keys = _.keys(obj);
    var length = keys.length;
    var pairs = Array(length);
    for (var i = 0; i < length; i++) {
      pairs[i] = [keys[i], obj[keys[i]]];
    }
    return pairs;
  };

  // Invert the keys and values of an object. The values must be serializable.
  _.invert = function(obj) {
    var result = {};
    var keys = _.keys(obj);
    for (var i = 0, length = keys.length; i < length; i++) {
      result[obj[keys[i]]] = keys[i];
    }
    return result;
  };

  // Return a sorted list of the function names available on the object.
  // Aliased as `methods`
  _.functions = _.methods = function(obj) {
    var names = [];
    for (var key in obj) {
      if (_.isFunction(obj[key])) names.push(key);
    }
    return names.sort();
  };

  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    return function(obj) {
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      for (var index = 1; index < length; index++) {
        var source = arguments[index],
            keys = keysFunc(source),
            l = keys.length;
        for (var i = 0; i < l; i++) {
          var key = keys[i];
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // Extend a given object with all the properties in passed-in object(s).
  _.extend = createAssigner(_.allKeys);

  // Assigns a given object with all the own properties in the passed-in object(s)
  // (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
  _.extendOwn = _.assign = createAssigner(_.keys);

  // Returns the first key on an object that passes a predicate test
  _.findKey = function(obj, predicate, context) {
    predicate = cb(predicate, context);
    var keys = _.keys(obj), key;
    for (var i = 0, length = keys.length; i < length; i++) {
      key = keys[i];
      if (predicate(obj[key], key, obj)) return key;
    }
  };

  // Internal pick helper function to determine if `obj` has key `key`.
  var keyInObj = function(value, key, obj) {
    return key in obj;
  };

  // Return a copy of the object only containing the whitelisted properties.
  _.pick = restArgs(function(obj, keys) {
    var result = {}, iteratee = keys[0];
    if (obj == null) return result;
    if (_.isFunction(iteratee)) {
      if (keys.length > 1) iteratee = optimizeCb(iteratee, keys[1]);
      keys = _.allKeys(obj);
    } else {
      iteratee = keyInObj;
      keys = flatten(keys, false, false);
      obj = Object(obj);
    }
    for (var i = 0, length = keys.length; i < length; i++) {
      var key = keys[i];
      var value = obj[key];
      if (iteratee(value, key, obj)) result[key] = value;
    }
    return result;
  });

   // Return a copy of the object without the blacklisted properties.
  _.omit = restArgs(function(obj, keys) {
    var iteratee = keys[0], context;
    if (_.isFunction(iteratee)) {
      iteratee = _.negate(iteratee);
      if (keys.length > 1) context = keys[1];
    } else {
      keys = _.map(flatten(keys, false, false), String);
      iteratee = function(value, key) {
        return !_.contains(keys, key);
      };
    }
    return _.pick(obj, iteratee, context);
  });

  // Fill in a given object with default properties.
  _.defaults = createAssigner(_.allKeys, true);

  // Creates an object that inherits from the given prototype object.
  // If additional properties are provided then they will be added to the
  // created object.
  _.create = function(prototype, props) {
    var result = baseCreate(prototype);
    if (props) _.extendOwn(result, props);
    return result;
  };

  // Create a (shallow-cloned) duplicate of an object.
  _.clone = function(obj) {
    if (!_.isObject(obj)) return obj;
    return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
  };

  // Invokes interceptor with the obj, and then returns obj.
  // The primary purpose of this method is to "tap into" a method chain, in
  // order to perform operations on intermediate results within the chain.
  _.tap = function(obj, interceptor) {
    interceptor(obj);
    return obj;
  };

  // Returns whether an object has a given set of `key:value` pairs.
  _.isMatch = function(object, attrs) {
    var keys = _.keys(attrs), length = keys.length;
    if (object == null) return !length;
    var obj = Object(object);
    for (var i = 0; i < length; i++) {
      var key = keys[i];
      if (attrs[key] !== obj[key] || !(key in obj)) return false;
    }
    return true;
  };


  // Internal recursive comparison function for `isEqual`.
  var eq, deepEq;
  eq = function(a, b, aStack, bStack) {
    // Identical objects are equal. `0 === -0`, but they aren't identical.
    // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // A strict comparison is necessary because `null == undefined`.
    if (a == null || b == null) return a === b;
    // `NaN`s are equivalent, but non-reflexive.
    if (a !== a) return b !== b;
    // Exhaust primitive checks
    var type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b !== 'object') return false;
    return deepEq(a, b, aStack, bStack);
  };

  // Internal recursive comparison function for `isEqual`.
  deepEq = function(a, b, aStack, bStack) {
    // Unwrap any wrapped objects.
    if (a instanceof _) a = a._wrapped;
    if (b instanceof _) b = b._wrapped;
    // Compare `[[Class]]` names.
    var className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
      // Strings, numbers, regular expressions, dates, and booleans are compared by value.
      case '[object RegExp]':
      // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
      case '[object String]':
        // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
        // equivalent to `new String("5")`.
        return '' + a === '' + b;
      case '[object Number]':
        // `NaN`s are equivalent, but non-reflexive.
        // Object(NaN) is equivalent to NaN
        if (+a !== +a) return +b !== +b;
        // An `egal` comparison is performed for other numeric values.
        return +a === 0 ? 1 / +a === 1 / b : +a === +b;
      case '[object Date]':
      case '[object Boolean]':
        // Coerce dates and booleans to numeric primitive values. Dates are compared by their
        // millisecond representations. Note that invalid dates with millisecond representations
        // of `NaN` are not equivalent.
        return +a === +b;
    }

    var areArrays = className === '[object Array]';
    if (!areArrays) {
      if (typeof a != 'object' || typeof b != 'object') return false;

      // Objects with different constructors are not equivalent, but `Object`s or `Array`s
      // from different frames are.
      var aCtor = a.constructor, bCtor = b.constructor;
      if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                               _.isFunction(bCtor) && bCtor instanceof bCtor)
                          && ('constructor' in a && 'constructor' in b)) {
        return false;
      }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    var length = aStack.length;
    while (length--) {
      // Linear search. Performance is inversely proportional to the number of
      // unique nested structures.
      if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // Recursively compare objects and arrays.
    if (areArrays) {
      // Compare array lengths to determine if a deep comparison is necessary.
      length = a.length;
      if (length !== b.length) return false;
      // Deep compare the contents, ignoring non-numeric properties.
      while (length--) {
        if (!eq(a[length], b[length], aStack, bStack)) return false;
      }
    } else {
      // Deep compare objects.
      var keys = _.keys(a), key;
      length = keys.length;
      // Ensure that both objects contain the same number of properties before comparing deep equality.
      if (_.keys(b).length !== length) return false;
      while (length--) {
        // Deep compare each member
        key = keys[length];
        if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
      }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
  };

  // Perform a deep comparison to check if two objects are equal.
  _.isEqual = function(a, b) {
    return eq(a, b);
  };

  // Is a given array, string, or object empty?
  // An "empty" object has no enumerable own-properties.
  _.isEmpty = function(obj) {
    if (obj == null) return true;
    if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
    return _.keys(obj).length === 0;
  };

  // Is a given value a DOM element?
  _.isElement = function(obj) {
    return !!(obj && obj.nodeType === 1);
  };

  // Is a given value an array?
  // Delegates to ECMA5's native Array.isArray
  _.isArray = nativeIsArray || function(obj) {
    return toString.call(obj) === '[object Array]';
  };

  // Is a given variable an object?
  _.isObject = function(obj) {
    var type = typeof obj;
    return type === 'function' || type === 'object' && !!obj;
  };

  // Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
  _.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
    _['is' + name] = function(obj) {
      return toString.call(obj) === '[object ' + name + ']';
    };
  });

  // Define a fallback version of the method in browsers (ahem, IE < 9), where
  // there isn't any inspectable "Arguments" type.
  if (!_.isArguments(arguments)) {
    _.isArguments = function(obj) {
      return _.has(obj, 'callee');
    };
  }

  // Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
  // IE 11 (#1621), and in Safari 8 (#1929).
  if (typeof /./ != 'function' && typeof Int8Array != 'object') {
    _.isFunction = function(obj) {
      return typeof obj == 'function' || false;
    };
  }

  // Is a given object a finite number?
  _.isFinite = function(obj) {
    return isFinite(obj) && !isNaN(parseFloat(obj));
  };

  // Is the given value `NaN`? (NaN is the only number which does not equal itself).
  _.isNaN = function(obj) {
    return _.isNumber(obj) && obj !== +obj;
  };

  // Is a given value a boolean?
  _.isBoolean = function(obj) {
    return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
  };

  // Is a given value equal to null?
  _.isNull = function(obj) {
    return obj === null;
  };

  // Is a given variable undefined?
  _.isUndefined = function(obj) {
    return obj === void 0;
  };

  // Shortcut function for checking if an object has a given property directly
  // on itself (in other words, not on a prototype).
  _.has = function(obj, key) {
    return obj != null && hasOwnProperty.call(obj, key);
  };

  // Utility Functions
  // -----------------

  // Run Underscore.js in *noConflict* mode, returning the `_` variable to its
  // previous owner. Returns a reference to the Underscore object.
  _.noConflict = function() {
    root._ = previousUnderscore;
    return this;
  };

  // Keep the identity function around for default iteratees.
  _.identity = function(value) {
    return value;
  };

  // Predicate-generating functions. Often useful outside of Underscore.
  _.constant = function(value) {
    return function() {
      return value;
    };
  };

  _.noop = function(){};

  _.property = property;

  // Generates a function for a given object that returns a given property.
  _.propertyOf = function(obj) {
    return obj == null ? function(){} : function(key) {
      return obj[key];
    };
  };

  // Returns a predicate for checking whether an object has a given set of
  // `key:value` pairs.
  _.matcher = _.matches = function(attrs) {
    attrs = _.extendOwn({}, attrs);
    return function(obj) {
      return _.isMatch(obj, attrs);
    };
  };

  // Run a function **n** times.
  _.times = function(n, iteratee, context) {
    var accum = Array(Math.max(0, n));
    iteratee = optimizeCb(iteratee, context, 1);
    for (var i = 0; i < n; i++) accum[i] = iteratee(i);
    return accum;
  };

  // Return a random integer between min and max (inclusive).
  _.random = function(min, max) {
    if (max == null) {
      max = min;
      min = 0;
    }
    return min + Math.floor(Math.random() * (max - min + 1));
  };

  // A (possibly faster) way to get the current timestamp as an integer.
  _.now = Date.now || function() {
    return new Date().getTime();
  };

   // List of HTML entities for escaping.
  var escapeMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '`': '&#x60;'
  };
  var unescapeMap = _.invert(escapeMap);

  // Functions for escaping and unescaping strings to/from HTML interpolation.
  var createEscaper = function(map) {
    var escaper = function(match) {
      return map[match];
    };
    // Regexes for identifying a key that needs to be escaped
    var source = '(?:' + _.keys(map).join('|') + ')';
    var testRegexp = RegExp(source);
    var replaceRegexp = RegExp(source, 'g');
    return function(string) {
      string = string == null ? '' : '' + string;
      return testRegexp.test(string) ? string.replace(replaceRegexp, escaper) : string;
    };
  };
  _.escape = createEscaper(escapeMap);
  _.unescape = createEscaper(unescapeMap);

  // If the value of the named `property` is a function then invoke it with the
  // `object` as context; otherwise, return it.
  _.result = function(object, prop, fallback) {
    var value = object == null ? void 0 : object[prop];
    if (value === void 0) {
      value = fallback;
    }
    return _.isFunction(value) ? value.call(object) : value;
  };

  // Generate a unique integer id (unique within the entire client session).
  // Useful for temporary DOM ids.
  var idCounter = 0;
  _.uniqueId = function(prefix) {
    var id = ++idCounter + '';
    return prefix ? prefix + id : id;
  };

  // By default, Underscore uses ERB-style template delimiters, change the
  // following template settings to use alternative delimiters.
  _.templateSettings = {
    evaluate: /<%([\s\S]+?)%>/g,
    interpolate: /<%=([\s\S]+?)%>/g,
    escape: /<%-([\s\S]+?)%>/g
  };

  // When customizing `templateSettings`, if you don't want to define an
  // interpolation, evaluation or escaping regex, we need one that is
  // guaranteed not to match.
  var noMatch = /(.)^/;

  // Certain characters need to be escaped so that they can be put into a
  // string literal.
  var escapes = {
    "'": "'",
    '\\': '\\',
    '\r': 'r',
    '\n': 'n',
    '\u2028': 'u2028',
    '\u2029': 'u2029'
  };

  var escapeRegExp = /\\|'|\r|\n|\u2028|\u2029/g;

  var escapeChar = function(match) {
    return '\\' + escapes[match];
  };

  // JavaScript micro-templating, similar to John Resig's implementation.
  // Underscore templating handles arbitrary delimiters, preserves whitespace,
  // and correctly escapes quotes within interpolated code.
  // NB: `oldSettings` only exists for backwards compatibility.
  _.template = function(text, settings, oldSettings) {
    if (!settings && oldSettings) settings = oldSettings;
    settings = _.defaults({}, settings, _.templateSettings);

    // Combine delimiters into one regular expression via alternation.
    var matcher = RegExp([
      (settings.escape || noMatch).source,
      (settings.interpolate || noMatch).source,
      (settings.evaluate || noMatch).source
    ].join('|') + '|$', 'g');

    // Compile the template source, escaping string literals appropriately.
    var index = 0;
    var source = "__p+='";
    text.replace(matcher, function(match, escape, interpolate, evaluate, offset) {
      source += text.slice(index, offset).replace(escapeRegExp, escapeChar);
      index = offset + match.length;

      if (escape) {
        source += "'+\n((__t=(" + escape + "))==null?'':_.escape(__t))+\n'";
      } else if (interpolate) {
        source += "'+\n((__t=(" + interpolate + "))==null?'':__t)+\n'";
      } else if (evaluate) {
        source += "';\n" + evaluate + "\n__p+='";
      }

      // Adobe VMs need the match returned to produce the correct offset.
      return match;
    });
    source += "';\n";

    // If a variable is not specified, place data values in local scope.
    if (!settings.variable) source = 'with(obj||{}){\n' + source + '}\n';

    source = "var __t,__p='',__j=Array.prototype.join," +
      "print=function(){__p+=__j.call(arguments,'');};\n" +
      source + 'return __p;\n';

    var render;
    try {
      render = new Function(settings.variable || 'obj', '_', source);
    } catch (e) {
      e.source = source;
      throw e;
    }

    var template = function(data) {
      return render.call(this, data, _);
    };

    // Provide the compiled source as a convenience for precompilation.
    var argument = settings.variable || 'obj';
    template.source = 'function(' + argument + '){\n' + source + '}';

    return template;
  };

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var chainResult = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return chainResult(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return chainResult(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return chainResult(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}());

(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as a module.
    define('eventable', function() {
      return (root.Eventable = factory());
    });
  } else if (typeof exports !== 'undefined') {
    // Node. Does not work with strict CommonJS, but only CommonJS-like
    // enviroments that support module.exports, like Node.
    module.exports = factory();
  } else {
    // Browser globals
    root.Eventable = factory();
  }
}(this, function() {

  // Copy and pasted straight out of Backbone 1.0.0
  // We'll try and keep this updated to the latest

  var array = [];
  var slice = array.slice;

  function once(func) {
    var memo, times = 2;

    return function() {
      if (--times > 0) {
        memo = func.apply(this, arguments);
      } else {
        func = null;
      }
      return memo;
    };
  }

  // Backbone.Events
  // ---------------

  // A module that can be mixed in to *any object* in order to provide it with
  // custom events. You may bind with `on` or remove with `off` callback
  // functions to an event; `trigger`-ing an event fires all callbacks in
  // succession.
  //
  //     var object = {};
  //     extend(object, Backbone.Events);
  //     object.on('expand', function(){ alert('expanded'); });
  //     object.trigger('expand');
  //
  var Eventable = {

    // Bind an event to a `callback` function. Passing `"all"` will bind
    // the callback to all events fired.
    on: function(name, callback, context) {
      if (!eventsApi(this, 'on', name, [callback, context]) || !callback) return this;
      this._events || (this._events = {});
      var events = this._events[name] || (this._events[name] = []);
      events.push({callback: callback, context: context, ctx: context || this});
      return this;
    },

    // Bind an event to only be triggered a single time. After the first time
    // the callback is invoked, it will be removed.
    once: function(name, callback, context) {
      if (!eventsApi(this, 'once', name, [callback, context]) || !callback) return this;
      var self = this;
      var func = once(function() {
        self.off(name, func);
        callback.apply(this, arguments);
      });
      func._callback = callback;
      return this.on(name, func, context);
    },

    // Remove one or many callbacks. If `context` is null, removes all
    // callbacks with that function. If `callback` is null, removes all
    // callbacks for the event. If `name` is null, removes all bound
    // callbacks for all events.
    off: function(name, callback, context) {
      var retain, ev, events, names, i, l, j, k;
      if (!this._events || !eventsApi(this, 'off', name, [callback, context])) return this;
      if (!name && !callback && !context) {
        this._events = {};
        return this;
      }

      names = name ? [name] : Object.keys(this._events);
      for (i = 0, l = names.length; i < l; i++) {
        name = names[i];
        if (events = this._events[name]) {
          this._events[name] = retain = [];
          if (callback || context) {
            for (j = 0, k = events.length; j < k; j++) {
              ev = events[j];
              if ((callback && callback !== ev.callback && callback !== ev.callback._callback) ||
                  (context && context !== ev.context)) {
                retain.push(ev);
              }
            }
          }
          if (!retain.length) delete this._events[name];
        }
      }

      return this;
    },

    // Trigger one or many events, firing all bound callbacks. Callbacks are
    // passed the same arguments as `trigger` is, apart from the event name
    // (unless you're listening on `"all"`, which will cause your callback to
    // receive the true name of the event as the first argument).
    trigger: function(name) {
      if (!this._events) return this;
      var args = slice.call(arguments, 1);
      if (!eventsApi(this, 'trigger', name, args)) return this;
      var events = this._events[name];
      var allEvents = this._events.all;
      if (events) triggerEvents(events, args);
      if (allEvents) triggerEvents(allEvents, arguments);
      return this;
    },

    // Tell this object to stop listening to either specific events ... or
    // to every object it's currently listening to.
    stopListening: function(obj, name, callback) {
      var listeners = this._listeners;
      if (!listeners) return this;
      var deleteListener = !name && !callback;
      if (typeof name === 'object') callback = this;
      if (obj) (listeners = {})[obj._listenerId] = obj;
      for (var id in listeners) {
        listeners[id].off(name, callback, this);
        if (deleteListener) delete this._listeners[id];
      }
      return this;
    }

  };

  // Regular expression used to split event strings.
  var eventSplitter = /\s+/;

  // Implement fancy features of the Events API such as multiple event
  // names `"change blur"` and jQuery-style event maps `{change: action}`
  // in terms of the existing API.
  var eventsApi = function(obj, action, name, rest) {
    if (!name) return true;

    // Handle event maps.
    if (typeof name === 'object') {
      for (var key in name) {
        obj[action].apply(obj, [key, name[key]].concat(rest));
      }
      return false;
    }

    // Handle space separated event names.
    if (eventSplitter.test(name)) {
      var names = name.split(eventSplitter);
      for (var i = 0, l = names.length; i < l; i++) {
        obj[action].apply(obj, [names[i]].concat(rest));
      }
      return false;
    }

    return true;
  };

  // A difficult-to-believe, but optimized internal dispatch function for
  // triggering events. Tries to keep the usual cases speedy (most internal
  // Backbone events have 3 arguments).
  var triggerEvents = function(events, args) {
    var ev, i = -1, l = events.length, a1 = args[0], a2 = args[1], a3 = args[2];
    switch (args.length) {
      case 0: while (++i < l) (ev = events[i]).callback.call(ev.ctx); return;
      case 1: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1); return;
      case 2: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2); return;
      case 3: while (++i < l) (ev = events[i]).callback.call(ev.ctx, a1, a2, a3); return;
      default: while (++i < l) (ev = events[i]).callback.apply(ev.ctx, args);
    }
  };

  // Inversion-of-control versions of `on` and `once`. Tell *this* object to
  // listen to an event in another object ... keeping track of what it's
  // listening to.
  function addListenMethod(method, implementation) {
    Eventable[method] = function(obj, name, callback) {
      var listeners = this._listeners || (this._listeners = {});
      var id = obj._listenerId || (obj._listenerId = (new Date()).getTime());
      listeners[id] = obj;
      if (typeof name === 'object') callback = this;
      obj[implementation](name, callback, this);
      return this;
    };
  }

  addListenMethod('listenTo', 'on');
  addListenMethod('listenToOnce', 'once');

  // Aliases for backwards compatibility.
  Eventable.bind   = Eventable.on;
  Eventable.unbind = Eventable.off;

  return Eventable;

}));
/*!
 * Sir Trevor JS v0.5.0-beta3
 *
 * Released under the MIT license
 * www.opensource.org/licenses/MIT
 *
 * 2015-04-12
 */

!function(root,factory){"object"==typeof exports&&"object"==typeof module?module.exports=factory(require("jquery")):"function"==typeof define&&define.amd?define(["jquery"],factory):"object"==typeof exports?exports.SirTrevor=factory(require("jquery")):root.SirTrevor=factory(root.jQuery)}(this,function(__WEBPACK_EXTERNAL_MODULE_33__){return function(modules){function __webpack_require__(moduleId){if(installedModules[moduleId])return installedModules[moduleId].exports;var module=installedModules[moduleId]={exports:{},id:moduleId,loaded:!1};return modules[moduleId].call(module.exports,module,module.exports,__webpack_require__),module.loaded=!0,module.exports}var installedModules={};return __webpack_require__.m=modules,__webpack_require__.c=installedModules,__webpack_require__.p="",__webpack_require__(0)}([function(module,exports,__webpack_require__){module.exports=__webpack_require__(1)},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2);__webpack_require__(31).shim(),__webpack_require__(32),__webpack_require__(3),__webpack_require__(4);var utils=__webpack_require__(5),SirTrevor={config:__webpack_require__(6),log:utils.log,Locales:__webpack_require__(7),Events:__webpack_require__(8),EventBus:__webpack_require__(9),EditorStore:__webpack_require__(10),Submittable:__webpack_require__(11),FileUploader:__webpack_require__(12),BlockMixins:__webpack_require__(29),BlockPositioner:__webpack_require__(13),BlockReorder:__webpack_require__(14),BlockDeletion:__webpack_require__(15),BlockValidations:__webpack_require__(16),BlockStore:__webpack_require__(17),BlockManager:__webpack_require__(18),SimpleBlock:__webpack_require__(19),Block:__webpack_require__(20),Blocks:__webpack_require__(30),BlockControl:__webpack_require__(21),BlockControls:__webpack_require__(22),FloatingBlockControls:__webpack_require__(23),FormatBar:__webpack_require__(24),Editor:__webpack_require__(25),toMarkdown:__webpack_require__(26),toHTML:__webpack_require__(27),setDefaults:function(options){Object.assign(SirTrevor.config.defaults,options||{})},getInstance:utils.getInstance,setBlockOptions:function(type,options){var block=SirTrevor.Blocks[type];_.isUndefined(block)||Object.assign(block.prototype,options||{})},runOnAllInstances:function(method){if(SirTrevor.Editor.prototype.hasOwnProperty(method)){var methodArgs=Array.prototype.slice.call(arguments,1);Array.prototype.forEach.call(SirTrevor.config.instances,function(i){i[method].apply(null,methodArgs)})}else SirTrevor.log("method doesn't exist")}};Object.assign(SirTrevor,__webpack_require__(28)),module.exports=SirTrevor},function(module,exports,__webpack_require__){"use strict";exports.isEmpty=__webpack_require__(52),exports.isFunction=__webpack_require__(53),exports.isObject=__webpack_require__(54),exports.isString=__webpack_require__(55),exports.isUndefined=__webpack_require__(56),exports.result=__webpack_require__(57),exports.template=__webpack_require__(58),exports.uniqueId=__webpack_require__(59)},function(module,exports,__webpack_require__){"use strict";[].includes||(Array.prototype.includes=function(searchElement){if(void 0===this||null===this)throw new TypeError("Cannot convert this value to object");var O=Object(this),len=parseInt(O.length)||0;if(0===len)return!1;var k,n=parseInt(arguments[1])||0;for(n>=0?k=n:(k=len+n,0>k&&(k=0));len>k;){var currentElement=O[k];if(searchElement===currentElement||searchElement!==searchElement&&currentElement!==currentElement)return!0;k++}return!1})},function(module,exports,__webpack_require__){"use strict";function dragEnter(e){e.preventDefault()}function dragOver(e){e.originalEvent.dataTransfer.dropEffect="copy",$(e.currentTarget).addClass("st-drag-over"),e.preventDefault()}function dragLeave(e){$(e.currentTarget).removeClass("st-drag-over"),e.preventDefault()}var $=__webpack_require__(33);$.fn.dropArea=function(){return this.bind("dragenter",dragEnter).bind("dragover",dragOver).bind("dragleave",dragLeave),this},$.fn.noDropArea=function(){return this.unbind("dragenter").unbind("dragover").unbind("dragleave"),this},$.fn.caretToEnd=function(){var range,selection;return range=document.createRange(),range.selectNodeContents(this[0]),range.collapse(!1),selection=window.getSelection(),selection.removeAllRanges(),selection.addRange(range),this}},function(module,exports,__webpack_require__){"use strict";var $=__webpack_require__(33),_=__webpack_require__(2),config=__webpack_require__(6),urlRegex=/^(?:([A-Za-z]+):)?(\/{0,3})([0-9.\-A-Za-z]+)(?::(\d+))?(?:\/([^?#]*))?(?:\?([^#]*))?(?:#(.*))?$/,utils={getInstance:function(identifier){return _.isUndefined(identifier)?config.instances[0]:_.isString(identifier)?config.instances.find(function(editor){return editor.ID===identifier}):config.instances[identifier]},getInstanceBySelection:function(){return utils.getInstance($(window.getSelection().anchorNode).parents(".st-block").data("instance"))},getBlockBySelection:function(){return utils.getInstanceBySelection().findBlockById($(window.getSelection().anchorNode).parents(".st-block").get(0).id)},log:function(){!_.isUndefined(console)&&config.debug&&console.log.apply(console,arguments)},isURI:function(string){return urlRegex.test(string)},titleize:function(str){return null===str?"":(str=String(str).toLowerCase(),str.replace(/(?:^|\s|-)\S/g,function(c){return c.toUpperCase()}))},classify:function(str){return utils.titleize(String(str).replace(/[\W_]/g," ")).replace(/\s/g,"")},capitalize:function(string){return string.charAt(0).toUpperCase()+string.substring(1).toLowerCase()},flatten:function(obj){var x={};return(Array.isArray(obj)?obj:Object.keys(obj)).forEach(function(i){x[i]=!0}),x},underscored:function(str){return str.trim().replace(/([a-z\d])([A-Z]+)/g,"$1_$2").replace(/[-\s]+/g,"_").toLowerCase()},reverse:function(str){return str.split("").reverse().join("")},toSlug:function(str){return str.toLowerCase().replace(/[^\w ]+/g,"").replace(/ +/g,"-")}};module.exports=utils},function(module,exports,__webpack_require__){"use strict";var drop_options={html:['<div class="st-block__dropzone">','<span class="st-icon"><%= _.result(block, "icon_name") %></span>','<p><%= i18n.t("general:drop", { block: "<span>" + _.result(block, "title") + "</span>" }) %>',"</p></div>"].join("\n"),re_render_on_reorder:!1},paste_options={html:['<input type="text" placeholder="<%= i18n.t("general:paste") %>"',' class="st-block__paste-input st-paste-block">'].join("")},upload_options={html:['<div class="st-block__upload-container">','<input type="file" type="st-file-upload">','<button class="st-upload-btn"><%= i18n.t("general:upload") %></button>',"</div>"].join("\n")};module.exports={debug:!1,scribeDebug:!1,skipValidation:!1,version:"0.4.0",language:"en",instances:[],defaults:{defaultType:!1,spinner:{className:"st-spinner",lines:9,length:8,width:3,radius:6,color:"#000",speed:1.4,trail:57,shadow:!1,left:"50%",top:"50%"},Block:{drop_options:drop_options,paste_options:paste_options,upload_options:upload_options},blockLimit:0,blockTypeLimits:{},required:[],uploadUrl:"/attachments",baseImageUrl:"/sir-trevor-uploads/",errorsContainer:void 0,convertFromMarkdown:!0,formatBar:{commands:[{name:"Bold",title:"bold",cmd:"bold",keyCode:66,text:"B"},{name:"Italic",title:"italic",cmd:"italic",keyCode:73,text:"i"},{name:"Link",title:"link",iconName:"link",cmd:"linkPrompt",text:"link"},{name:"Unlink",title:"unlink",iconName:"link",cmd:"unlink",text:"link"}]}}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),config=__webpack_require__(6),utils=__webpack_require__(5),Locales={en:{general:{"delete":"Delete?",drop:"Drag __block__ here",paste:"Or paste URL here",upload:"...or choose a file",close:"close",position:"Position",wait:"Please wait...",link:"Enter a link"},errors:{title:"You have the following errors:",validation_fail:"__type__ block is invalid",block_empty:"__name__ must not be empty",type_missing:"You must have a block of type __type__",required_type_empty:"A required block type __type__ is empty",load_fail:"There was a problem loading the contents of the document"},blocks:{text:{title:"Text"},list:{title:"List"},quote:{title:"Quote",credit_field:"Credit"},image:{title:"Image",upload_error:"There was a problem with your upload"},video:{title:"Video"},tweet:{title:"Tweet",fetch_error:"There was a problem fetching your tweet"},embedly:{title:"Embedly",fetch_error:"There was a problem fetching your embed",key_missing:"An Embedly API key must be present"},heading:{title:"Heading"}}}};void 0===window.i18n?(utils.log("Using i18n stub"),window.i18n={t:function(key,options){var str,obj,part,i,parts=key.split(":");for(obj=Locales[config.language],i=0;i<parts.length;i++)part=parts[i],_.isUndefined(obj[part])||(obj=obj[part]);return str=obj,_.isString(str)?(str.indexOf("__")>=0&&Object.keys(options).forEach(function(opt){str=str.replace("__"+opt+"__",options[opt])}),str):""}}):(utils.log("Using i18next"),i18n.init({resStore:Locales,fallbackLng:config.language,ns:{namespaces:["general","blocks"],defaultNs:"general"}})),module.exports=Locales},function(module,exports,__webpack_require__){"use strict";module.exports=__webpack_require__(60)},function(module,exports,__webpack_require__){"use strict";module.exports=Object.assign({},__webpack_require__(8))},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5),EditorStore=function(data,mediator){this.mediator=mediator,this.initialize(data?data.trim():"")};Object.assign(EditorStore.prototype,{initialize:function(data){this.store=this._parseData(data)||{data:[]}},retrieve:function(){return this.store},toString:function(space){return JSON.stringify(this.store,void 0,space)},reset:function(){utils.log("Resetting the EditorStore"),this.store={data:[]}},addData:function(data){return this.store.data.push(data),this.store},_parseData:function(data){var result;if(0===data.length)return result;try{var jsonStr=JSON.parse(data);_.isUndefined(jsonStr.data)||(result=jsonStr)}catch(e){this.mediator.trigger("errors:add",{text:i18n.t("errors:load_fail")}),this.mediator.trigger("errors:render"),console.log("Sorry there has been a problem with parsing the JSON"),console.log(e)}return result}}),module.exports=EditorStore},function(module,exports,__webpack_require__){"use strict";var $=__webpack_require__(33),utils=__webpack_require__(5),EventBus=__webpack_require__(9),Submittable=function($form){this.$form=$form,this.initialize()};Object.assign(Submittable.prototype,{initialize:function(){this.submitBtn=this.$form.find("input[type='submit']");var btnTitles=[];this.submitBtn.each(function(i,btn){btnTitles.push($(btn).attr("value"))}),this.submitBtnTitles=btnTitles,this.canSubmit=!0,this.globalUploadCount=0,this._bindEvents()},setSubmitButton:function(e,message){this.submitBtn.attr("value",message)},resetSubmitButton:function(){var titles=this.submitBtnTitles;this.submitBtn.each(function(index,item){$(item).attr("value",titles[index])})},onUploadStart:function(e){this.globalUploadCount++,utils.log("onUploadStart called "+this.globalUploadCount),1===this.globalUploadCount&&this._disableSubmitButton()},onUploadStop:function(e){this.globalUploadCount=this.globalUploadCount<=0?0:this.globalUploadCount-1,utils.log("onUploadStop called "+this.globalUploadCount),0===this.globalUploadCount&&this._enableSubmitButton()},onError:function(e){utils.log("onError called"),this.canSubmit=!1},_disableSubmitButton:function(message){this.setSubmitButton(null,message||i18n.t("general:wait")),this.submitBtn.attr("disabled","disabled").addClass("disabled")},_enableSubmitButton:function(){this.resetSubmitButton(),this.submitBtn.removeAttr("disabled").removeClass("disabled")},_events:{disableSubmitButton:"_disableSubmitButton",enableSubmitButton:"_enableSubmitButton",setSubmitButton:"setSubmitButton",resetSubmitButton:"resetSubmitButton",onError:"onError",onUploadStart:"onUploadStart",onUploadStop:"onUploadStop"},_bindEvents:function(){Object.keys(this._events).forEach(function(type){EventBus.on(type,this[this._events[type]],this)},this)}}),module.exports=Submittable},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),config=__webpack_require__(6),utils=__webpack_require__(5),EventBus=__webpack_require__(9);module.exports=function(block,file,success,error){EventBus.trigger("onUploadStart");var uid=[block.blockID,(new Date).getTime(),"raw"].join("-"),data=new FormData;data.append("attachment[name]",file.name),data.append("attachment[file]",file),data.append("attachment[uid]",uid),block.resetMessages();var callbackSuccess=function(data){utils.log("Upload callback called"),EventBus.trigger("onUploadStop"),!_.isUndefined(success)&&_.isFunction(success)&&success.apply(block,arguments)},callbackError=function(jqXHR,status,errorThrown){utils.log("Upload callback error called"),EventBus.trigger("onUploadStop"),!_.isUndefined(error)&&_.isFunction(error)&&error.call(block,status)},url=block.uploadUrl||config.defaults.uploadUrl,xhr=$.ajax({url:url,data:data,cache:!1,contentType:!1,processData:!1,dataType:"json",type:"POST"});return block.addQueuedItem(uid,xhr),xhr.done(callbackSuccess).fail(callbackError).always(block.removeQueuedItem.bind(block,uid)),xhr}},function(module,exports,__webpack_require__){"use strict";var template=["<div class='st-block-positioner__inner'>","<span class='st-block-positioner__selected-value'></span>","<select class='st-block-positioner__select'></select>","</div>"].join("\n"),BlockPositioner=function(block_element,mediator){this.mediator=mediator,this.$block=block_element,this._ensureElement(),this._bindFunctions(),this.initialize()};Object.assign(BlockPositioner.prototype,__webpack_require__(34),__webpack_require__(35),{total_blocks:0,bound:["onBlockCountChange","onSelectChange","toggle","show","hide"],className:"st-block-positioner",visibleClass:"st-block-positioner--is-visible",initialize:function(){this.$el.append(template),this.$select=this.$(".st-block-positioner__select"),this.$select.on("change",this.onSelectChange),this.mediator.on("block:countUpdate",this.onBlockCountChange)},onBlockCountChange:function(new_count){new_count!==this.total_blocks&&(this.total_blocks=new_count,this.renderPositionList())},onSelectChange:function(){var val=this.$select.val();0!==val&&(this.mediator.trigger("block:changePosition",this.$block,val,1===val?"before":"after"),this.toggle())},renderPositionList:function(){for(var inner="<option value='0'>"+i18n.t("general:position")+"</option>",i=1;i<=this.total_blocks;i++)inner+="<option value="+i+">"+i+"</option>";this.$select.html(inner)},toggle:function(){this.$select.val(0),this.$el.toggleClass(this.visibleClass)},show:function(){this.$el.addClass(this.visibleClass)},hide:function(){this.$el.removeClass(this.visibleClass)}}),module.exports=BlockPositioner},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),EventBus=__webpack_require__(9),BlockReorder=function(block_element,mediator){this.$block=block_element,this.blockID=this.$block.attr("id"),this.mediator=mediator,this._ensureElement(),this._bindFunctions(),this.initialize()};Object.assign(BlockReorder.prototype,__webpack_require__(34),__webpack_require__(35),{bound:["onMouseDown","onDragStart","onDragEnd","onDrop"],className:"st-block-ui-btn st-block-ui-btn--reorder st-icon",tagName:"a",attributes:function(){return{html:"reorder",draggable:"true","data-icon":"move"}},initialize:function(){this.$el.bind("mousedown touchstart",this.onMouseDown).bind("dragstart",this.onDragStart).bind("dragend touchend",this.onDragEnd),this.$block.dropArea().bind("drop",this.onDrop)},blockId:function(){return this.$block.attr("id")},onMouseDown:function(){this.mediator.trigger("block-controls:hide"),EventBus.trigger("block:reorder:down")},onDrop:function(ev){ev.preventDefault();var dropped_on=this.$block,item_id=ev.originalEvent.dataTransfer.getData("text/plain"),block=$("#"+item_id);_.isUndefined(item_id)||_.isEmpty(block)||dropped_on.attr("id")===item_id||dropped_on.attr("data-instance")!==block.attr("data-instance")||dropped_on.after(block),this.mediator.trigger("block:rerender",item_id),EventBus.trigger("block:reorder:dropped",item_id)},onDragStart:function(ev){var btn=$(ev.currentTarget).parent();ev.originalEvent.dataTransfer.setDragImage(this.$block[0],btn.position().left,btn.position().top),ev.originalEvent.dataTransfer.setData("Text",this.blockId()),EventBus.trigger("block:reorder:dragstart"),this.$block.addClass("st-block--dragging")},onDragEnd:function(ev){EventBus.trigger("block:reorder:dragend"),this.$block.removeClass("st-block--dragging")},render:function(){return this}}),module.exports=BlockReorder},function(module,exports,__webpack_require__){"use strict";var BlockDeletion=function(){this._ensureElement(),this._bindFunctions()};Object.assign(BlockDeletion.prototype,__webpack_require__(34),__webpack_require__(35),{tagName:"a",className:"st-block-ui-btn st-block-ui-btn--delete st-icon",attributes:{html:"delete","data-icon":"bin"}}),module.exports=BlockDeletion},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),utils=__webpack_require__(5),bestNameFromField=function(field){var msg=field.attr("data-st-name")||field.attr("name");return msg||(msg="Field"),utils.capitalize(msg)};module.exports={errors:[],valid:function(){return this.performValidations(),0===this.errors.length},performValidations:function(){this.resetErrors();var required_fields=this.$(".st-required");required_fields.each(function(i,f){this.validateField(f)}.bind(this)),this.validations.forEach(this.runValidator,this),this.$el.toggleClass("st-block--with-errors",this.errors.length>0)},validations:[],validateField:function(field){field=$(field);var content=field.attr("contenteditable")?field.text():field.val();0===content.length&&this.setError(field,i18n.t("errors:block_empty",{name:bestNameFromField(field)}))},runValidator:function(validator){_.isUndefined(this[validator])||this[validator].call(this)},setError:function(field,reason){var $msg=this.addMessage(reason,"st-msg--error");field.addClass("st-error"),this.errors.push({field:field,reason:reason,msg:$msg})},resetErrors:function(){this.errors.forEach(function(error){error.field.removeClass("st-error"),error.msg.remove()}),this.$messages.removeClass("st-block__messages--is-visible"),this.errors=[]}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5),EventBus=__webpack_require__(9);module.exports={blockStorage:{},createStore:function(blockData){this.blockStorage={type:utils.underscored(this.type),data:blockData||{}}},save:function(){var data=this._serializeData();_.isEmpty(data)||this.setData(data)},getData:function(){return this.save(),this.blockStorage},getBlockData:function(){return this.save(),this.blockStorage.data},_getData:function(){return this.blockStorage.data},setData:function(blockData){utils.log("Setting data for block "+this.blockID),Object.assign(this.blockStorage.data,blockData||{})},setAndLoadData:function(blockData){this.setData(blockData),this.beforeLoadingData()},_serializeData:function(){},loadData:function(){},beforeLoadingData:function(){utils.log("loadData for "+this.blockID),EventBus.trigger("editor/block/loadData"),this.loadData(this._getData())},_loadData:function(){utils.log("_loadData is deprecated and will be removed in the future. Please use beforeLoadingData instead."),this.beforeLoadingData()},checkAndLoadData:function(){_.isEmpty(this._getData())||this.beforeLoadingData()}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5),config=__webpack_require__(6),EventBus=__webpack_require__(9),Blocks=__webpack_require__(30),BLOCK_OPTION_KEYS=["convertToMarkdown","convertFromMarkdown","formatBar"],BlockManager=function(options,editorInstance,mediator){this.options=options,this.blockOptions=BLOCK_OPTION_KEYS.reduce(function(acc,key){return acc[key]=options[key],acc},{}),this.instance_scope=editorInstance,this.mediator=mediator,this.blocks=[],this.blockCounts={},this.blockTypes={},this._setBlocksTypes(),this._setRequired(),this._bindMediatedEvents(),this.initialize()};Object.assign(BlockManager.prototype,__webpack_require__(34),__webpack_require__(36),__webpack_require__(8),{eventNamespace:"block",mediatedEvents:{create:"createBlock",remove:"removeBlock",rerender:"rerenderBlock"},initialize:function(){},createBlock:function(type,data){if(type=utils.classify(type),this.canCreateBlock(type)){var block=new Blocks[type](data,this.instance_scope,this.mediator,this.blockOptions);this.blocks.push(block),this._incrementBlockTypeCount(type),this.mediator.trigger("block:render",block),this.triggerBlockCountUpdate(),this.mediator.trigger("block:limitReached",this.blockLimitReached()),EventBus.trigger(data?"block:create:existing":"block:create:new",block),utils.log("Block created of type "+type)}},removeBlock:function(blockID){var block=this.findBlockById(blockID),type=utils.classify(block.type);this.mediator.trigger("block-controls:reset"),this.blocks=this.blocks.filter(function(item){return item.blockID!==block.blockID}),this._decrementBlockTypeCount(type),this.triggerBlockCountUpdate(),this.mediator.trigger("block:limitReached",this.blockLimitReached()),EventBus.trigger("block:remove")},rerenderBlock:function(blockID){var block=this.findBlockById(blockID);_.isUndefined(block)||block.isEmpty()||!block.drop_options.re_render_on_reorder||block.beforeLoadingData()},triggerBlockCountUpdate:function(){this.mediator.trigger("block:countUpdate",this.blocks.length)},canCreateBlock:function(type){return this.blockLimitReached()?(utils.log("Cannot add any more blocks. Limit reached."),!1):this.isBlockTypeAvailable(type)?this.canAddBlockType(type)?!0:(utils.log("Block Limit reached for type "+type),!1):(utils.log("Block type not available "+type),!1)},validateBlockTypesExist:function(shouldValidate){return config.skipValidation||!shouldValidate?!1:void(this.required||[]).forEach(function(type,index){if(this.isBlockTypeAvailable(type))if(0===this._getBlockTypeCount(type))utils.log("Failed validation on required block type "+type),this.mediator.trigger("errors:add",{text:i18n.t("errors:type_missing",{type:type})});else{var blocks=this.getBlocksByType(type).filter(function(b){return!b.isEmpty()});if(blocks.length>0)return!1;this.mediator.trigger("errors:add",{text:i18n.t("errors:required_type_empty",{type:type})}),utils.log("A required block type "+type+" is empty")}},this)},findBlockById:function(blockID){return this.blocks.find(function(b){return b.blockID===blockID})},getBlocksByType:function(type){return this.blocks.filter(function(b){return utils.classify(b.type)===type})},getBlocksByIDs:function(block_ids){return this.blocks.filter(function(b){return block_ids.includes(b.blockID)})},blockLimitReached:function(){return 0!==this.options.blockLimit&&this.blocks.length>=this.options.blockLimit},isBlockTypeAvailable:function(t){return!_.isUndefined(this.blockTypes[t])},canAddBlockType:function(type){var block_type_limit=this._getBlockTypeLimit(type);return!(0!==block_type_limit&&this._getBlockTypeCount(type)>=block_type_limit)},_setBlocksTypes:function(){this.blockTypes=utils.flatten(_.isUndefined(this.options.blockTypes)?Blocks:this.options.blockTypes)},_setRequired:function(){this.required=!1,Array.isArray(this.options.required)&&!_.isEmpty(this.options.required)&&(this.required=this.options.required)},_incrementBlockTypeCount:function(type){this.blockCounts[type]=_.isUndefined(this.blockCounts[type])?1:this.blockCounts[type]+1},_decrementBlockTypeCount:function(type){this.blockCounts[type]=_.isUndefined(this.blockCounts[type])?1:this.blockCounts[type]-1},_getBlockTypeCount:function(type){return _.isUndefined(this.blockCounts[type])?0:this.blockCounts[type]},_blockLimitReached:function(){return 0!==this.options.blockLimit&&this.blocks.length>=this.options.blockLimit},_getBlockTypeLimit:function(t){return this.isBlockTypeAvailable(t)?parseInt(_.isUndefined(this.options.blockTypeLimits[t])?0:this.options.blockTypeLimits[t],10):0}}),module.exports=BlockManager},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5),$=__webpack_require__(33),BlockReorder=__webpack_require__(14),SimpleBlock=function(data,instance_id,mediator,options){this.createStore(data),this.blockID=_.uniqueId("st-block-"),this.instanceID=instance_id,this.mediator=mediator,this.options=options||{},this._ensureElement(),this._bindFunctions(),this.initialize.apply(this,arguments)};Object.assign(SimpleBlock.prototype,__webpack_require__(34),__webpack_require__(8),__webpack_require__(35),__webpack_require__(17),{focus:function(){},valid:function(){return!0},className:"st-block",block_template:_.template("<div class='st-block__inner'><%= editor_html %></div>"),attributes:function(){return{id:this.blockID,"data-type":this.type,"data-instance":this.instanceID}},title:function(){return utils.titleize(this.type.replace(/[\W_]/g," "))},blockCSSClass:function(){return this.blockCSSClass=utils.toSlug(this.type),this.blockCSSClass},type:"","class":function(){return utils.classify(this.type)},editorHTML:"",initialize:function(){},onBlockRender:function(){},beforeBlockRender:function(){},_setBlockInner:function(){var editor_html=_.result(this,"editorHTML");this.$el.append(this.block_template({editor_html:editor_html})),this.$inner=this.$el.find(".st-block__inner"),this.$inner.bind("click mouseover",function(e){e.stopPropagation()})},render:function(){return this.beforeBlockRender(),this._setBlockInner(),this._blockPrepare(),this},_blockPrepare:function(){this._initUI(),this._initMessages(),this.checkAndLoadData(),this.$el.addClass("st-item-ready"),this.on("onRender",this.onBlockRender),this.save()},_withUIComponent:function(component,className,callback){this.$ui.append(component.render().$el),className&&callback&&this.$ui.on("click",className,callback)},_initUI:function(){var ui_element=$("<div>",{"class":"st-block__ui"});this.$inner.append(ui_element),this.$ui=ui_element,this._initUIComponents()},_initMessages:function(){var msgs_element=$("<div>",{"class":"st-block__messages"});this.$inner.prepend(msgs_element),this.$messages=msgs_element},addMessage:function(msg,additionalClass){var $msg=$("<span>",{html:msg,"class":"st-msg "+additionalClass});return this.$messages.append($msg).addClass("st-block__messages--is-visible"),$msg},resetMessages:function(){this.$messages.html("").removeClass("st-block__messages--is-visible")},_initUIComponents:function(){this._withUIComponent(new BlockReorder(this.$el))}}),SimpleBlock.fn=SimpleBlock.prototype,SimpleBlock.extend=__webpack_require__(37),module.exports=SimpleBlock},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),Scribe=__webpack_require__(61),scribePluginFormatterPlainTextConvertNewLinesToHTML=__webpack_require__(62),scribePluginLinkPromptCommand=__webpack_require__(63),config=__webpack_require__(6),utils=__webpack_require__(5),BlockMixins=__webpack_require__(29),SimpleBlock=__webpack_require__(19),BlockReorder=__webpack_require__(14),BlockDeletion=__webpack_require__(15),BlockPositioner=__webpack_require__(13),EventBus=__webpack_require__(9),Spinner=__webpack_require__(64),Block=function(data,instance_id,mediator,options){SimpleBlock.apply(this,arguments)};Block.prototype=Object.create(SimpleBlock.prototype),Block.prototype.constructor=Block;var delete_template=["<div class='st-block__ui-delete-controls'>","<label class='st-block__delete-label'>","<%= i18n.t('general:delete') %>","</label>","<a class='st-block-ui-btn st-block-ui-btn--confirm-delete st-icon' data-icon='tick'></a>","<a class='st-block-ui-btn st-block-ui-btn--deny-delete st-icon' data-icon='close'></a>","</div>"].join("\n");Object.assign(Block.prototype,SimpleBlock.fn,__webpack_require__(16),{bound:["_handleContentPaste","_onFocus","_onBlur","onDrop","onDeleteClick","clearInsertedStyles","getSelectionForFormatter","onBlockRender"],className:"st-block st-icon--add",attributes:function(){return Object.assign(SimpleBlock.fn.attributes.call(this),{"data-icon-after":"add"})},icon_name:"default",validationFailMsg:function(){return i18n.t("errors:validation_fail",{type:this.title()})},editorHTML:'<div class="st-block__editor"></div>',toolbarEnabled:!0,availableMixins:["droppable","pastable","uploadable","fetchable","ajaxable","controllable"],droppable:!1,pastable:!1,uploadable:!1,fetchable:!1,ajaxable:!1,drop_options:{},paste_options:{},upload_options:{},formattable:!0,_previousSelection:"",initialize:function(){},toMarkdown:function(markdown){return markdown},toHTML:function(html){return html},withMixin:function(mixin){if(_.isObject(mixin)){var initializeMethod="initialize"+mixin.mixinName;_.isUndefined(this[initializeMethod])&&(Object.assign(this,mixin),this[initializeMethod]())}},render:function(){if(this.beforeBlockRender(),this._setBlockInner(),this.$editor=this.$inner.children().first(),this.mixinsRequireInputs=!1,this.availableMixins.forEach(function(mixin){if(this[mixin]){var blockMixin=BlockMixins[utils.classify(mixin)];!_.isUndefined(blockMixin.requireInputs)&&blockMixin.requireInputs&&(this.mixinsRequireInputs=!0)}},this),this.mixinsRequireInputs){var input_html=$("<div>",{"class":"st-block__inputs"});this.$inner.append(input_html),this.$inputs=input_html}return this.hasTextBlock()&&this._initTextBlocks(),this.availableMixins.forEach(function(mixin){this[mixin]&&this.withMixin(BlockMixins[utils.classify(mixin)])},this),this.formattable&&this._initFormatting(),this._blockPrepare(),this},remove:function(){this.ajaxable&&this.resolveAllInQueue(),this.$el.remove()},loading:function(){_.isUndefined(this.spinner)||this.ready(),this.spinner=new Spinner(config.defaults.spinner),this.spinner.spin(this.$el[0]),this.$el.addClass("st--is-loading")},ready:function(){this.$el.removeClass("st--is-loading"),_.isUndefined(this.spinner)||(this.spinner.stop(),delete this.spinner)},_serializeData:function(){utils.log("toData for "+this.blockID);var data={};return this.hasTextBlock()&&(data.text=this.getTextBlockHTML(),data.isHtml=!0),this.$(":input").not(".st-paste-block").length>0&&this.$(":input").each(function(index,input){input.getAttribute("name")&&(data[input.getAttribute("name")]=input.value)}),data},focus:function(){this.getTextBlock().focus()},blur:function(){this.getTextBlock().blur()},onFocus:function(){this.getTextBlock().bind("focus",this._onFocus)},onBlur:function(){this.getTextBlock().bind("blur",this._onBlur)},_onFocus:function(){this.trigger("blockFocus",this.$el)},_onBlur:function(){},onBlockRender:function(){this.focus()},onDrop:function(dataTransferObj){},onDeleteClick:function(ev){ev.preventDefault();var onDeleteConfirm=function(e){e.preventDefault(),this.mediator.trigger("block:remove",this.blockID),this.remove()},onDeleteDeny=function(e){e.preventDefault(),this.$el.removeClass("st-block--delete-active"),$delete_el.remove()};if(this.isEmpty())return void onDeleteConfirm.call(this,new Event("click"));this.$inner.append(_.template(delete_template)),this.$el.addClass("st-block--delete-active");var $delete_el=this.$inner.find(".st-block__ui-delete-controls");this.$inner.on("click",".st-block-ui-btn--confirm-delete",onDeleteConfirm.bind(this)).on("click",".st-block-ui-btn--deny-delete",onDeleteDeny.bind(this))},beforeLoadingData:function(){this.loading(),this.mixinsRequireInputs&&(this.$editor.show(),this.$inputs.hide()),SimpleBlock.fn.beforeLoadingData.call(this),this.ready()},execTextBlockCommand:function(cmdName){if(_.isUndefined(this._scribe))throw"No Scribe instance found to send a command to";var cmd=this._scribe.getCommand(cmdName);this._scribe.el.focus(),cmd.execute()},queryTextBlockCommandState:function(cmdName){if(_.isUndefined(this._scribe))throw"No Scribe instance found to query command";

var cmd=this._scribe.getCommand(cmdName),sel=new this._scribe.api.Selection;return sel.range&&cmd.queryState()},_handleContentPaste:function(ev){setTimeout(this.onContentPasted.bind(this,ev,$(ev.currentTarget)),0)},_getBlockClass:function(){return"st-block--"+this.className},_initUIComponents:function(){var positioner=new BlockPositioner(this.$el,this.mediator);this._withUIComponent(positioner,".st-block-ui-btn--reorder",positioner.toggle),this._withUIComponent(new BlockReorder(this.$el,this.mediator)),this._withUIComponent(new BlockDeletion,".st-block-ui-btn--delete",this.onDeleteClick),this.onFocus(),this.onBlur()},_initFormatting:function(){var block=this;this.options.formatBar&&this.options.formatBar.commands.forEach(function(cmd){if(!_.isUndefined(cmd.keyCode)){var ctrlDown=!1;block.$el.on("keyup",".st-text-block",function(ev){(17===ev.which||224===ev.which||91===ev.which)&&(ctrlDown=!1)}).on("keydown",".st-text-block",{formatter:cmd},function(ev){(17===ev.which||224===ev.which||91===ev.which)&&(ctrlDown=!0),ev.which===ev.data.formatter.keyCode&&ctrlDown&&(ev.preventDefault(),block.execTextBlockCommand(ev.data.formatter.cmd))})}})},_initTextBlocks:function(){this.getTextBlock().bind("keyup",this.getSelectionForFormatter).bind("mouseup",this.getSelectionForFormatter).bind("DOMNodeInserted",this.clearInsertedStyles);var textBlock=this.getTextBlock().get(0);if(!_.isUndefined(textBlock)&&_.isUndefined(this._scribe)){var scribeConfig={debug:config.scribeDebug};_.isObject(this.scribeOptions)&&(scribeConfig=Object.assign(scribeConfig,this.scribeOptions)),this._scribe=new Scribe(textBlock,scribeConfig),this._scribe.use(scribePluginFormatterPlainTextConvertNewLinesToHTML()),this._scribe.use(scribePluginLinkPromptCommand()),_.isFunction(this.configureScribe)&&this.configureScribe.call(this,this._scribe)}},getSelectionForFormatter:function(){var block=this;setTimeout(function(){var selection=window.getSelection(),selectionStr=selection.toString().trim(),en="formatter:"+(""===selectionStr?"hide":"position");block.mediator.trigger(en,block),EventBus.trigger(en,block)},1)},clearInsertedStyles:function(e){var target=e.target;target.removeAttribute("style")},hasTextBlock:function(){return this.getTextBlock().length>0},getTextBlock:function(){return _.isUndefined(this.text_block)&&(this.text_block=this.$(".st-text-block")),this.text_block},getTextBlockHTML:function(){return this._scribe.getContent()},setTextBlockHTML:function(html){return this._scribe.setContent(html)},isEmpty:function(){return _.isEmpty(this.getBlockData())}}),Block.extend=__webpack_require__(37),module.exports=Block},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),Blocks=__webpack_require__(30),BlockControl=function(type){this.type=type,this.block_type=Blocks[this.type].prototype,this.can_be_rendered=this.block_type.toolbarEnabled,this._ensureElement()};Object.assign(BlockControl.prototype,__webpack_require__(34),__webpack_require__(35),__webpack_require__(8),{tagName:"a",className:"st-block-control",attributes:function(){return{"data-type":this.block_type.type}},render:function(){return this.$el.html('<span class="st-icon">'+_.result(this.block_type,"icon_name")+"</span>"+_.result(this.block_type,"title")),this}}),module.exports=BlockControl},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),Blocks=__webpack_require__(30),BlockControl=__webpack_require__(21),EventBus=__webpack_require__(9),BlockControls=function(available_types,mediator){this.available_types=available_types||[],this.mediator=mediator,this._ensureElement(),this._bindFunctions(),this._bindMediatedEvents(),this.initialize()};Object.assign(BlockControls.prototype,__webpack_require__(34),__webpack_require__(36),__webpack_require__(35),__webpack_require__(8),{bound:["handleControlButtonClick"],block_controls:null,className:"st-block-controls",eventNamespace:"block-controls",mediatedEvents:{render:"renderInContainer",show:"show",hide:"hide"},initialize:function(){for(var block_type in this.available_types)if(Blocks.hasOwnProperty(block_type)){var block_control=new BlockControl(block_type);block_control.can_be_rendered&&this.$el.append(block_control.render().$el)}this.$el.delegate(".st-block-control","click",this.handleControlButtonClick),this.mediator.on("block-controls:show",this.renderInContainer)},show:function(){this.$el.addClass("st-block-controls--active"),EventBus.trigger("block:controls:shown")},hide:function(){this.removeCurrentContainer(),this.$el.removeClass("st-block-controls--active"),EventBus.trigger("block:controls:hidden")},handleControlButtonClick:function(e){e.stopPropagation(),this.mediator.trigger("block:create",$(e.currentTarget).attr("data-type"))},renderInContainer:function(container){this.removeCurrentContainer(),container.append(this.$el.detach()),container.addClass("with-st-controls"),this.currentContainer=container,this.show()},removeCurrentContainer:function(){_.isUndefined(this.currentContainer)||(this.currentContainer.removeClass("with-st-controls"),this.currentContainer=void 0)}}),module.exports=BlockControls},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),EventBus=__webpack_require__(9),FloatingBlockControls=function(wrapper,instance_id,mediator){this.$wrapper=wrapper,this.instance_id=instance_id,this.mediator=mediator,this._ensureElement(),this._bindFunctions(),this.initialize()};Object.assign(FloatingBlockControls.prototype,__webpack_require__(34),__webpack_require__(35),__webpack_require__(8),{className:"st-block-controls__top",attributes:function(){return{"data-icon":"add"}},bound:["handleBlockMouseOut","handleBlockMouseOver","handleBlockClick","onDrop"],initialize:function(){this.$el.on("click",this.handleBlockClick).dropArea().bind("drop",this.onDrop),this.$wrapper.on("mouseover",".st-block",this.handleBlockMouseOver).on("mouseout",".st-block",this.handleBlockMouseOut).on("click",".st-block--with-plus",this.handleBlockClick)},onDrop:function(ev){ev.preventDefault();var dropped_on=this.$el,item_id=ev.originalEvent.dataTransfer.getData("text/plain"),block=$("#"+item_id);_.isUndefined(item_id)||_.isEmpty(block)||dropped_on.attr("id")===item_id||this.instance_id!==block.attr("data-instance")||dropped_on.after(block),EventBus.trigger("block:reorder:dropped",item_id)},handleBlockMouseOver:function(e){var block=$(e.currentTarget);block.hasClass("st-block--with-plus")||block.addClass("st-block--with-plus")},handleBlockMouseOut:function(e){var block=$(e.currentTarget);block.hasClass("st-block--with-plus")&&block.removeClass("st-block--with-plus")},handleBlockClick:function(e){e.stopPropagation(),this.mediator.trigger("block-controls:render",$(e.currentTarget))}}),module.exports=FloatingBlockControls},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),config=__webpack_require__(6),utils=__webpack_require__(5),FormatBar=function(options,mediator,editor){this.editor=editor,this.options=Object.assign({},config.defaults.formatBar,options||{}),this.commands=this.options.commands,this.mediator=mediator,this._ensureElement(),this._bindFunctions(),this._bindMediatedEvents(),this.initialize.apply(this,arguments)};Object.assign(FormatBar.prototype,__webpack_require__(34),__webpack_require__(36),__webpack_require__(8),__webpack_require__(35),{className:"st-format-bar",bound:["onFormatButtonClick","renderBySelection","hide"],eventNamespace:"formatter",mediatedEvents:{position:"renderBySelection",show:"show",hide:"hide"},initialize:function(){this.$btns=[],this.commands.forEach(function(format){var btn=$("<button>",{"class":"st-format-btn st-format-btn--"+format.name+" "+(format.iconName?"st-icon":""),text:format.text,"data-cmd":format.cmd});this.$btns.push(btn),btn.appendTo(this.$el)},this),this.$b=$(document)},hide:function(){this.$el.removeClass("st-format-bar--is-ready"),this.$el.remove()},show:function(){this.editor.$outer.append(this.$el),this.$el.addClass("st-format-bar--is-ready"),this.$el.bind("click",".st-format-btn",this.onFormatButtonClick)},remove:function(){this.$el.remove()},renderBySelection:function(){this.highlightSelectedButtons(),this.show(),this.calculatePosition()},calculatePosition:function(){var selection=window.getSelection(),range=selection.getRangeAt(0),boundary=range.getBoundingClientRect(),coords={},outer=this.editor.$outer.get(0),outerBoundary=outer.getBoundingClientRect();coords.top=boundary.top-outerBoundary.top+"px",coords.left=(boundary.left+boundary.right)/2-this.el.offsetWidth/2-outerBoundary.left+"px",this.$el.css(coords)},highlightSelectedButtons:function(){var block=utils.getBlockBySelection();this.$btns.forEach(function(btn){var cmd=$(btn).data("cmd");btn.toggleClass("st-format-btn--is-active",block.queryTextBlockCommandState(cmd))},this)},onFormatButtonClick:function(ev){ev.stopPropagation();var block=utils.getBlockBySelection();if(_.isUndefined(block))throw"Associated block not found";var btn=$(ev.target),cmd=btn.data("cmd");return _.isUndefined(cmd)?!1:(block.execTextBlockCommand(cmd),this.highlightSelectedButtons(),!1)}}),module.exports=FormatBar},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),config=__webpack_require__(6),utils=__webpack_require__(5),Events=__webpack_require__(8),EventBus=__webpack_require__(9),FormEvents=__webpack_require__(28),BlockControls=__webpack_require__(22),BlockManager=__webpack_require__(18),FloatingBlockControls=__webpack_require__(23),FormatBar=__webpack_require__(24),EditorStore=__webpack_require__(10),ErrorHandler=__webpack_require__(38),Editor=function(options){this.initialize(options)};Object.assign(Editor.prototype,__webpack_require__(34),__webpack_require__(8),{bound:["onFormSubmit","hideAllTheThings","changeBlockPosition","removeBlockDragOver","renderBlock","resetBlockControls","blockLimitReached"],events:{"block:reorder:dragend":"removeBlockDragOver","block:reorder:dropped":"removeBlockDragOver","block:content:dropped":"removeBlockDragOver"},initialize:function(options){return utils.log("Init SirTrevor.Editor"),this.options=Object.assign({},config.defaults,options||{}),this.ID=_.uniqueId("st-editor-"),this._ensureAndSetElements()?(!_.isUndefined(this.options.onEditorRender)&&_.isFunction(this.options.onEditorRender)&&(this.onEditorRender=this.options.onEditorRender),this.mediator=Object.assign({},Events),this._bindFunctions(),config.instances.push(this),this.build(),void FormEvents.bindFormSubmit(this.$form)):!1},build:function(){this.$el.hide(),this.errorHandler=new ErrorHandler(this.$outer,this.mediator,this.options.errorsContainer),this.store=new EditorStore(this.$el.val(),this.mediator),this.block_manager=new BlockManager(this.options,this.ID,this.mediator),this.block_controls=new BlockControls(this.block_manager.blockTypes,this.mediator),this.fl_block_controls=new FloatingBlockControls(this.$wrapper,this.ID,this.mediator),this.formatBar=new FormatBar(this.options.formatBar,this.mediator,this),this.mediator.on("block:changePosition",this.changeBlockPosition),this.mediator.on("block-controls:reset",this.resetBlockControls),this.mediator.on("block:limitReached",this.blockLimitReached),this.mediator.on("block:render",this.renderBlock),this.dataStore="Please use store.retrieve();",this._setEvents(),this.$wrapper.prepend(this.fl_block_controls.render().$el),this.$outer.append(this.block_controls.render().$el),$(window).bind("click",this.hideAllTheThings),this.createBlocks(),this.$wrapper.addClass("st-ready"),_.isUndefined(this.onEditorRender)||this.onEditorRender()},createBlocks:function(){var store=this.store.retrieve();store.data.length>0?store.data.forEach(function(block){this.mediator.trigger("block:create",block.type,block.data)},this):this.options.defaultType!==!1&&this.mediator.trigger("block:create",this.options.defaultType,{})},destroy:function(){this.formatBar.destroy(),this.fl_block_controls.destroy(),this.block_controls.destroy(),this.block_manager.blocks.forEach(function(block){this.mediator.trigger("block:remove",block.blockID)},this),this.mediator.stopListening(),this.stopListening(),config.instances=config.instances.filter(function(instance){return instance.ID!==this.ID},this),this.store.reset(),this.$outer.replaceWith(this.$el.detach())},reinitialize:function(options){this.destroy(),this.initialize(options||this.options)},resetBlockControls:function(){this.block_controls.renderInContainer(this.$wrapper),this.block_controls.hide()},blockLimitReached:function(toggle){this.$wrapper.toggleClass("st--block-limit-reached",toggle)},_setEvents:function(){Object.keys(this.events).forEach(function(type){EventBus.on(type,this[this.events[type]],this)},this)},hideAllTheThings:function(e){this.block_controls.hide(),this.formatBar.hide()},store:function(method,options){return utils.log("The store method has been removed, please call store[methodName]"),this.store[method].call(this,options||{})},renderBlock:function(block){this._renderInPosition(block.render().$el),this.hideAllTheThings(),block.trigger("onRender")},removeBlockDragOver:function(){this.$outer.find(".st-drag-over").removeClass("st-drag-over")},changeBlockPosition:function($block,selectedPosition){selectedPosition-=1;var blockPosition=this.getBlockPosition($block),$blockBy=this.$wrapper.find(".st-block").eq(selectedPosition),where=blockPosition>selectedPosition?"Before":"After";$blockBy&&$blockBy.attr("id")!==$block.attr("id")&&(this.hideAllTheThings(),$block["insert"+where]($blockBy))},_renderInPosition:function(block){this.block_controls.currentContainer?this.block_controls.currentContainer.after(block):this.$wrapper.append(block)},validateAndSaveBlock:function(block,shouldValidate){if((!config.skipValidation||shouldValidate)&&!block.valid())return this.mediator.trigger("errors:add",{text:_.result(block,"validationFailMsg")}),void utils.log("Block "+block.blockID+" failed validation");var blockData=block.getData();utils.log("Adding data for block "+block.blockID+" to block store:",blockData),this.store.addData(blockData)},onFormSubmit:function(shouldValidate){return shouldValidate=shouldValidate===!1?!1:!0,utils.log("Handling form submission for Editor "+this.ID),this.mediator.trigger("errors:reset"),this.store.reset(),this.validateBlocks(shouldValidate),this.block_manager.validateBlockTypesExist(shouldValidate),this.mediator.trigger("errors:render"),this.$el.val(this.store.toString()),this.errorHandler.errors.length},validateBlocks:function(shouldValidate){var self=this;this.$wrapper.find(".st-block").each(function(idx,block){var _block=self.block_manager.findBlockById($(block).attr("id"));_.isUndefined(_block)||self.validateAndSaveBlock(_block,shouldValidate)})},findBlockById:function(block_id){return this.block_manager.findBlockById(block_id)},getBlocksByType:function(block_type){return this.block_manager.getBlocksByType(block_type)},getBlocksByIDs:function(block_ids){return this.block_manager.getBlocksByIDs(block_ids)},getBlockPosition:function($block){return this.$wrapper.find(".st-block").index($block)},_ensureAndSetElements:function(){if(_.isUndefined(this.options.el)||_.isEmpty(this.options.el))return utils.log("You must provide an el"),!1;this.$el=this.options.el,this.el=this.options.el[0],this.$form=this.$el.parents("form");var $outer=$("<div>").attr({id:this.ID,"class":"st-outer",dropzone:"copy link move"}),$wrapper=$("<div>").attr({"class":"st-blocks"});return this.$el.wrap($outer).wrap($wrapper),this.$outer=this.$form.find("#"+this.ID),this.$wrapper=this.$outer.find(".st-blocks"),!0}}),module.exports=Editor},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5);module.exports=function(content,type){function replaceBolds(match,p1,p2){return _.isUndefined(p2)&&(p2=""),"**"+p1.replace(/<(.)?br(.)?>/g,"")+"**"+p2}function replaceItalics(match,p1,p2){return _.isUndefined(p2)&&(p2=""),"_"+p1.replace(/<(.)?br(.)?>/g,"")+"_"+p2}var Blocks=__webpack_require__(30);type=utils.classify(type);var markdown=content;markdown=markdown.replace(/&nbsp;/g," "),markdown=markdown.replace(/( class=(")?Mso[a-zA-Z]+(")?)/g,"").replace(/<!--(.*?)-->/g,"").replace(/\/\*(.*?)\*\//g,"").replace(/<(\/)*(meta|link|span|\\?xml:|st1:|o:|font)(.*?)>/gi,"");var tagStripper,i,badTags=["style","script","applet","embed","noframes","noscript"];for(i=0;i<badTags.length;i++)tagStripper=new RegExp("<"+badTags[i]+".*?"+badTags[i]+"(.*?)>","gi"),markdown=markdown.replace(tagStripper,"");markdown=markdown.replace(/\*/g,"\\*").replace(/\[/g,"\\[").replace(/\]/g,"\\]").replace(/\_/g,"\\_").replace(/\(/g,"\\(").replace(/\)/g,"\\)").replace(/\-/g,"\\-");var inlineTags=["em","i","strong","b"];for(i=0;i<inlineTags.length;i++)tagStripper=new RegExp("<"+inlineTags[i]+"><br></"+inlineTags[i]+">","gi"),markdown=markdown.replace(tagStripper,"<br>");markdown=markdown.replace(/<(\w+)(?:\s+\w+="[^"]+(?:"\$[^"]+"[^"]+)?")*>\s*<\/\1>/gim,"").replace(/\n/gm,"").replace(/<a.*?href=[""'](.*?)[""'].*?>(.*?)<\/a>/gim,function(match,p1,p2){return"["+p2.trim().replace(/<(.)?br(.)?>/g,"")+"]("+p1+")"}).replace(/<strong>(?:\s*)(.*?)(\s)*?<\/strong>/gim,replaceBolds).replace(/<b>(?:\s*)(.*?)(\s*)?<\/b>/gim,replaceBolds).replace(/<em>(?:\s*)(.*?)(\s*)?<\/em>/gim,replaceItalics).replace(/<i>(?:\s*)(.*?)(\s*)?<\/i>/gim,replaceItalics),markdown=markdown.replace(/([^<>]+)(<div>)/g,"$1\n$2").replace(/<div><div>/g,"\n<div>").replace(/(?:<div>)([^<>]+)(?:<div>)/g,"$1\n").replace(/(?:<div>)(?:<br>)?([^<>]+)(?:<br>)?(?:<\/div>)/g,"$1\n").replace(/<\/p>/g,"\n\n").replace(/<(.)?br(.)?>/g,"\n").replace(/&lt;/g,"<").replace(/&gt;/g,">");var block;return Blocks.hasOwnProperty(type)&&(block=Blocks[type],!_.isUndefined(block.prototype.toMarkdown)&&_.isFunction(block.prototype.toMarkdown)&&(markdown=block.prototype.toMarkdown(markdown))),markdown=markdown.replace(/<\/?[^>]+(>|$)/g,"")}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5);module.exports=function(markdown,type){var Blocks=__webpack_require__(30);type=utils.classify(type);var html=markdown,shouldWrap="Text"===type;_.isUndefined(shouldWrap)&&(shouldWrap=!1),shouldWrap&&(html="<p>"+html),html=html.replace(/\[([^\]]+)\]\(([^\)]+)\)/gm,function(match,p1,p2){return"<a href='"+p2+"'>"+p1.replace(/\n/g,"")+"</a>"}),html=utils.reverse(utils.reverse(html).replace(/_(?!\\)((_\\|[^_])*)_(?=$|[^\\])/gm,function(match,p1){return">i/<"+p1.replace(/\n/g,"").replace(/[\s]+$/,"")+">i<"}).replace(/\*\*(?!\\)((\*\*\\|[^\*\*])*)\*\*(?=$|[^\\])/gm,function(match,p1){return">b/<"+p1.replace(/\n/g,"").replace(/[\s]+$/,"")+">b<"})),html=html.replace(/^\> (.+)$/gm,"$1");var block;return Blocks.hasOwnProperty(type)&&(block=Blocks[type],!_.isUndefined(block.prototype.toHTML)&&_.isFunction(block.prototype.toHTML)&&(html=block.prototype.toHTML(html))),shouldWrap&&(html=html.replace(/\n\s*\n/gm,"</p><p>"),html=html.replace(/\n/gm,"<br>")),html=html.replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;").replace(/\n/g,"<br>").replace(/\*\*/,"").replace(/__/,""),html=html.replace(/\\\*/g,"*").replace(/\\\[/g,"[").replace(/\\\]/g,"]").replace(/\\\_/g,"_").replace(/\\\(/g,"(").replace(/\\\)/g,")").replace(/\\\-/g,"-"),shouldWrap&&(html+="</p>"),html}},function(module,exports,__webpack_require__){"use strict";var config=__webpack_require__(6),utils=__webpack_require__(5),EventBus=__webpack_require__(9),Submittable=__webpack_require__(11),formBound=!1,FormEvents={bindFormSubmit:function(form){formBound||(new Submittable(form),form.bind("submit",this.onFormSubmit),formBound=!0)},onBeforeSubmit:function(shouldValidate){var errors=0;return config.instances.forEach(function(inst,i){errors+=inst.onFormSubmit(shouldValidate)}),utils.log("Total errors: "+errors),errors},onFormSubmit:function(ev){var errors=FormEvents.onBeforeSubmit();errors>0&&(EventBus.trigger("onError"),ev.preventDefault())}};module.exports=FormEvents},function(module,exports,__webpack_require__){"use strict";module.exports={Ajaxable:__webpack_require__(39),Controllable:__webpack_require__(40),Droppable:__webpack_require__(41),Fetchable:__webpack_require__(42),Pastable:__webpack_require__(43),Uploadable:__webpack_require__(44)}},function(module,exports,__webpack_require__){"use strict";module.exports={Text:__webpack_require__(45),Quote:__webpack_require__(46),Image:__webpack_require__(47),Heading:__webpack_require__(48),List:__webpack_require__(49),Tweet:__webpack_require__(50),Video:__webpack_require__(51)}},function(module,exports,__webpack_require__){"use strict";var keys=__webpack_require__(65),canBeObject=function(obj){return"undefined"!=typeof obj&&null!==obj},assignShim=function(target,source1){if(!canBeObject(target))throw new TypeError("target must be an object");var s,source,i,props,objTarget=Object(target);for(s=1;s<arguments.length;++s)for(source=Object(arguments[s]),props=keys(source),i=0;i<props.length;++i)objTarget[props[i]]=source[props[i]];return objTarget};assignShim.shim=function(){return Object.assign||(Object.assign=assignShim),Object.assign||assignShim},module.exports=assignShim},function(module,exports,__webpack_require__){!function(globals){if(!Array.prototype.find){var find=function(predicate){var list=Object(this),length=list.length<0?0:list.length>>>0;if(0===length)return void 0;if("function"!=typeof predicate||"[object Function]"!==Object.prototype.toString.call(predicate))throw new TypeError("Array#find: predicate must be a function");for(var value,thisArg=arguments[1],i=0;length>i;i++)if(value=list[i],predicate.call(thisArg,value,i,list))return value;return void 0};if(Object.defineProperty)try{Object.defineProperty(Array.prototype,"find",{value:find,configurable:!0,enumerable:!1,writable:!0})}catch(e){}Array.prototype.find||(Array.prototype.find=find)}}(this)},function(module,exports,__webpack_require__){module.exports=__WEBPACK_EXTERNAL_MODULE_33__},function(module,exports,__webpack_require__){"use strict";module.exports={bound:[],_bindFunctions:function(){this.bound.forEach(function(f){this[f]=this[f].bind(this)},this)}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33);module.exports={tagName:"div",className:"sir-trevor__view",attributes:{},$:function(selector){return this.$el.find(selector)},render:function(){return this},destroy:function(){_.isUndefined(this.stopListening)||this.stopListening(),this.$el.remove()},_ensureElement:function(){if(this.el)this._setElement(this.el);else{var html,attrs=Object.assign({},_.result(this,"attributes"));this.id&&(attrs.id=this.id),this.className&&(attrs["class"]=this.className),attrs.html&&(html=attrs.html,delete attrs.html);var $el=$("<"+this.tagName+">").attr(attrs);html&&$el.html(html),this._setElement($el)}},_setElement:function(element){return this.$el=$(element),this.el=this.$el[0],this}}},function(module,exports,__webpack_require__){"use strict";module.exports={mediatedEvents:{},eventNamespace:null,_bindMediatedEvents:function(){Object.keys(this.mediatedEvents).forEach(function(eventName){var cb=this.mediatedEvents[eventName];eventName=this.eventNamespace?this.eventNamespace+":"+eventName:eventName,this.mediator.on(eventName,this[cb].bind(this))},this)}}},function(module,exports,__webpack_require__){"use strict";module.exports=function(protoProps,staticProps){var child,parent=this;child=protoProps&&protoProps.hasOwnProperty("constructor")?protoProps.constructor:function(){return parent.apply(this,arguments)},Object.assign(child,parent,staticProps);var Surrogate=function(){this.constructor=child};return Surrogate.prototype=parent.prototype,child.prototype=new Surrogate,protoProps&&Object.assign(child.prototype,protoProps),child.__super__=parent.prototype,child}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),ErrorHandler=function($wrapper,mediator,container){this.$wrapper=$wrapper,this.mediator=mediator,this.$el=container,_.isUndefined(this.$el)&&(this._ensureElement(),this.$wrapper.prepend(this.$el)),this.$el.hide(),this._bindFunctions(),this._bindMediatedEvents(),this.initialize()};Object.assign(ErrorHandler.prototype,__webpack_require__(34),__webpack_require__(36),__webpack_require__(35),{errors:[],className:"st-errors",eventNamespace:"errors",mediatedEvents:{reset:"reset",add:"addMessage",render:"render"},initialize:function(){var $list=$("<ul>");this.$el.append("<p>"+i18n.t("errors:title")+"</p>").append($list),this.$list=$list},render:function(){return 0===this.errors.length?!1:(this.errors.forEach(this.createErrorItem,this),void this.$el.show())},createErrorItem:function(error){var $error=$("<li>",{"class":"st-errors__msg",html:error.text});this.$list.append($error)},addMessage:function(error){this.errors.push(error)},reset:function(){return 0===this.errors.length?!1:(this.errors=[],this.$list.html(""),void this.$el.hide())}}),module.exports=ErrorHandler},function(module,exports,__webpack_require__){"use strict";var utils=__webpack_require__(5);module.exports={mixinName:"Ajaxable",ajaxable:!0,initializeAjaxable:function(){this._queued=[]},addQueuedItem:function(name,deferred){utils.log("Adding queued item for "+this.blockID+" called "+name),this._queued.push({name:name,deferred:deferred})},removeQueuedItem:function(name){utils.log("Removing queued item for "+this.blockID+" called "+name),this._queued=this._queued.filter(function(queued){return queued.name!==name})},hasItemsInQueue:function(){return this._queued.length>0},resolveAllInQueue:function(){this._queued.forEach(function(item){utils.log("Aborting queued request: "+item.name),item.deferred.abort()},this)}}},function(module,exports,__webpack_require__){"use strict";var $=__webpack_require__(33),utils=__webpack_require__(5);module.exports={mixinName:"Controllable",initializeControllable:function(){utils.log("Adding controllable to block "+this.blockID),this.$control_ui=$("<div>",{"class":"st-block__control-ui"}),Object.keys(this.controls).forEach(function(cmd){this.addUiControl(cmd,this.controls[cmd].bind(this))},this),this.$inner.append(this.$control_ui)},getControlTemplate:function(cmd){return $("<a>",{"data-icon":cmd,"class":"st-icon st-block-control-ui-btn st-block-control-ui-btn--"+cmd})},addUiControl:function(cmd,handler){this.$control_ui.append(this.getControlTemplate(cmd)),this.$control_ui.on("click",".st-block-control-ui-btn--"+cmd,handler)}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),config=__webpack_require__(6),utils=__webpack_require__(5),EventBus=__webpack_require__(9);module.exports={mixinName:"Droppable",valid_drop_file_types:["File","Files","text/plain","text/uri-list"],requireInputs:!0,initializeDroppable:function(){utils.log("Adding droppable to block "+this.blockID),this.drop_options=Object.assign({},config.defaults.Block.drop_options,this.drop_options);var drop_html=$(_.template(this.drop_options.html,{block:this,_:_}));this.$editor.hide(),this.$inputs.append(drop_html),this.$dropzone=drop_html,this.$dropzone.dropArea().bind("drop",this._handleDrop.bind(this)),this.$inner.addClass("st-block__inner--droppable")},_handleDrop:function(e){e.preventDefault(),e=e.originalEvent;var el=$(e.target),types=e.dataTransfer.types;el.removeClass("st-dropzone--dragover"),types&&types.some(function(type){return this.valid_drop_file_types.includes(type)},this)&&this.onDrop(e.dataTransfer),EventBus.trigger("block:content:dropped",this.blockID)}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33);module.exports={mixinName:"Fetchable",initializeFetchable:function(){this.withMixin(__webpack_require__(39))},fetch:function(options,success,failure){var uid=_.uniqueId(this.blockID+"_fetch"),xhr=$.ajax(options);return this.resetMessages(),this.addQueuedItem(uid,xhr),_.isUndefined(success)||xhr.done(success.bind(this)),_.isUndefined(failure)||xhr.fail(failure.bind(this)),xhr.always(this.removeQueuedItem.bind(this,uid)),xhr}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),config=__webpack_require__(6),utils=__webpack_require__(5);module.exports={mixinName:"Pastable",requireInputs:!0,initializePastable:function(){utils.log("Adding pastable to block "+this.blockID),this.paste_options=Object.assign({},config.defaults.Block.paste_options,this.paste_options),this.$inputs.append(_.template(this.paste_options.html,this)),this.$(".st-paste-block").bind("click",function(){$(this).select()}).bind("paste",this._handleContentPaste).bind("submit",this._handleContentPaste)}}},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),config=__webpack_require__(6),utils=__webpack_require__(5),fileUploader=__webpack_require__(12);module.exports={mixinName:"Uploadable",uploadsCount:0,requireInputs:!0,initializeUploadable:function(){utils.log("Adding uploadable to block "+this.blockID),this.withMixin(__webpack_require__(39)),this.upload_options=Object.assign({},config.defaults.Block.upload_options,this.upload_options),this.$inputs.append(_.template(this.upload_options.html,this))},uploader:function(file,success,failure){return fileUploader(this,file,success,failure)}}},function(module,exports,__webpack_require__){"use strict";var Block=__webpack_require__(20),stToHTML=__webpack_require__(27);module.exports=Block.extend({type:"text",title:function(){return i18n.t("blocks:text:title")},editorHTML:'<div class="st-required st-text-block" contenteditable="true"></div>',icon_name:"text",loadData:function(data){this.setTextBlockHTML(this.options.convertFromMarkdown&&!data.isHtml?stToHTML(data.text,this.type):data.text)}})},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),Block=__webpack_require__(20),stToHTML=__webpack_require__(27),template=_.template(['<blockquote class="st-required st-text-block" contenteditable="true"></blockquote>','<label class="st-input-label"> <%= i18n.t("blocks:quote:credit_field") %></label>','<input maxlength="140" name="cite" placeholder="<%= i18n.t("blocks:quote:credit_field") %>"',' class="st-input-string st-required js-cite-input" type="text" />'].join("\n"));module.exports=Block.extend({type:"quote",title:function(){return i18n.t("blocks:quote:title")},icon_name:"quote",editorHTML:function(){return template(this)},loadData:function(data){this.setTextBlockHTML(this.options.convertFromMarkdown&&!data.isHtml?stToHTML(data.text,this.type):data.text),this.$(".js-cite-input").val(data.cite)}})},function(module,exports,__webpack_require__){"use strict";var $=__webpack_require__(33),Block=__webpack_require__(20);module.exports=Block.extend({type:"image",title:function(){return i18n.t("blocks:image:title")},droppable:!0,uploadable:!0,icon_name:"image",loadData:function(data){this.$editor.html($("<img>",{src:data.file.url}))},onBlockRender:function(){this.$inputs.find("button").bind("click",function(ev){ev.preventDefault()}),this.$inputs.find("input").on("change",function(ev){this.onDrop(ev.currentTarget)}.bind(this))},onDrop:function(transferData){var file=transferData.files[0],urlAPI="undefined"!=typeof URL?URL:"undefined"!=typeof webkitURL?webkitURL:null;/image/.test(file.type)&&(this.loading(),this.$inputs.hide(),this.$editor.html($("<img>",{src:urlAPI.createObjectURL(file)})).show(),this.uploader(file,function(data){this.setData(data),this.ready()},function(error){this.addMessage(i18n.t("blocks:image:upload_error")),this.ready()}))}})},function(module,exports,__webpack_require__){"use strict";var Block=__webpack_require__(20),stToHTML=__webpack_require__(27);module.exports=Block.extend({type:"Heading",title:function(){return i18n.t("blocks:heading:title")},editorHTML:'<div class="st-required st-text-block st-text-block--heading" contenteditable="true"></div>',scribeOptions:{
allowBlockElements:!1},icon_name:"heading",loadData:function(data){this.setTextBlockHTML(this.options.convertFromMarkdown&&!data.isHtml?stToHTML(data.text,this.type):data.text)}})},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),Block=__webpack_require__(20),stToHTML=__webpack_require__(27),template='<div class="st-text-block st-required" contenteditable="true"><ul><li></li></ul></div>';module.exports=Block.extend({type:"list",title:function(){return i18n.t("blocks:list:title")},icon_name:"list",editorHTML:function(){return _.template(template,this)},loadData:function(data){this.setTextBlockHTML(this.options.convertFromMarkdown&&!data.isHtml?"<ul>"+stToHTML(data.text,this.type)+"</ul>":data.text)},onBlockRender:function(){this.checkForList=this.checkForList.bind(this),this.getTextBlock().on("click keyup",this.checkForList),this.focus()},checkForList:function(){0===this.$("ul").length&&document.execCommand("insertUnorderedList",!1,!1)},toHTML:function(html){return html=html.replace(/^ - (.+)$/gm,"<li>$1</li>").replace(/\n/gm,"")},onContentPasted:function(event,target){this.$("ul").html(this.pastedMarkdownToHTML(target[0].innerHTML)),this.getTextBlock().caretToEnd()},isEmpty:function(){return _.isEmpty(this.getBlockData().text)}})},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),$=__webpack_require__(33),utils=__webpack_require__(5),Block=__webpack_require__(20),tweet_template=_.template(["<blockquote class='twitter-tweet' align='center'>","<p><%= text %></p>","&mdash; <%= user.name %> (@<%= user.screen_name %>)","<a href='<%= status_url %>' data-datetime='<%= created_at %>'><%= created_at %></a>","</blockquote>",'<script src="//platform.twitter.com/widgets.js" charset="utf-8"></script>'].join("\n"));module.exports=Block.extend({type:"tweet",droppable:!0,pastable:!0,fetchable:!0,drop_options:{re_render_on_reorder:!0},title:function(){return i18n.t("blocks:tweet:title")},fetchUrl:function(tweetID){return"/tweets/?tweet_id="+tweetID},icon_name:"twitter",loadData:function(data){_.isUndefined(data.status_url)&&(data.status_url=""),this.$inner.find("iframe").remove(),this.$inner.prepend(tweet_template(data))},onContentPasted:function(event){var input=$(event.target),val=input.val();this.handleTwitterDropPaste(val)},handleTwitterDropPaste:function(url){if(!this.validTweetUrl(url))return void utils.log("Invalid Tweet URL");var tweetID=url.match(/[^\/]+$/);if(!_.isEmpty(tweetID)){this.loading(),tweetID=tweetID[0];var ajaxOptions={url:this.fetchUrl(tweetID),dataType:"json"};this.fetch(ajaxOptions,this.onTweetSuccess,this.onTweetFail)}},validTweetUrl:function(url){return utils.isURI(url)&&-1!==url.indexOf("twitter")&&-1!==url.indexOf("status")},onTweetSuccess:function(data){var obj={user:{profile_image_url:data.user.profile_image_url,profile_image_url_https:data.user.profile_image_url_https,screen_name:data.user.screen_name,name:data.user.name},id:data.id_str,text:data.text,created_at:data.created_at,entities:data.entities,status_url:"https://twitter.com/"+data.user.screen_name+"/status/"+data.id_str};this.setAndLoadData(obj),this.ready()},onTweetFail:function(){this.addMessage(i18n.t("blocks:tweet:fetch_error")),this.ready()},onDrop:function(transferData){var url=transferData.getData("text/plain");this.handleTwitterDropPaste(url)}})},function(module,exports,__webpack_require__){"use strict";var _=__webpack_require__(2),utils=__webpack_require__(5),Block=__webpack_require__(20);module.exports=Block.extend({providers:{vimeo:{regex:/(?:http[s]?:\/\/)?(?:www.)?vimeo.com\/(.+)/,html:'<iframe src="<%= protocol %>//player.vimeo.com/video/<%= remote_id %>?title=0&byline=0" width="580" height="320" frameborder="0"></iframe>'},youtube:{regex:/^.*(?:youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/,html:'<iframe src="<%= protocol %>//www.youtube.com/embed/<%= remote_id %>" width="580" height="320" frameborder="0" allowfullscreen></iframe>'}},type:"video",title:function(){return i18n.t("blocks:video:title")},droppable:!0,pastable:!0,icon_name:"video",loadData:function(data){if(this.providers.hasOwnProperty(data.source)){var source=this.providers[data.source],protocol="file:"===window.location.protocol?"http:":window.location.protocol,aspectRatioClass=source.square?"with-square-media":"with-sixteen-by-nine-media";this.$editor.addClass("st-block__editor--"+aspectRatioClass).html(_.template(source.html,{protocol:protocol,remote_id:data.remote_id,width:this.$editor.width()}))}},onContentPasted:function(event){this.handleDropPaste(event.target.value)},matchVideoProvider:function(provider,index,url){var match=provider.regex.exec(url);return null==match||_.isUndefined(match[1])?{}:{source:index,remote_id:match[1]}},handleDropPaste:function(url){if(utils.isURI(url))for(var key in this.providers)this.providers.hasOwnProperty(key)&&this.setAndLoadData(this.matchVideoProvider(this.providers[key],key,url))},onDrop:function(transferData){var url=transferData.getData("text/plain");this.handleDropPaste(url)}})},function(module,exports,__webpack_require__){function isEmpty(value){var result=!0;if(!value)return result;var className=toString.call(value),length=value.length;return className==arrayClass||className==stringClass||className==argsClass||className==objectClass&&"number"==typeof length&&isFunction(value.splice)?!length:(forOwn(value,function(){return result=!1}),result)}var forOwn=__webpack_require__(82),isFunction=__webpack_require__(53),argsClass="[object Arguments]",arrayClass="[object Array]",objectClass="[object Object]",stringClass="[object String]",objectProto=Object.prototype,toString=objectProto.toString;module.exports=isEmpty},function(module,exports,__webpack_require__){function isFunction(value){return"function"==typeof value}module.exports=isFunction},function(module,exports,__webpack_require__){function isObject(value){return!(!value||!objectTypes[typeof value])}var objectTypes=__webpack_require__(83);module.exports=isObject},function(module,exports,__webpack_require__){function isString(value){return"string"==typeof value||value&&"object"==typeof value&&toString.call(value)==stringClass||!1}var stringClass="[object String]",objectProto=Object.prototype,toString=objectProto.toString;module.exports=isString},function(module,exports,__webpack_require__){function isUndefined(value){return"undefined"==typeof value}module.exports=isUndefined},function(module,exports,__webpack_require__){function result(object,key){if(object){var value=object[key];return isFunction(value)?object[key]():value}}var isFunction=__webpack_require__(53);module.exports=result},function(module,exports,__webpack_require__){function template(text,data,options){var settings=templateSettings.imports._.templateSettings||templateSettings;text=String(text||""),options=defaults({},options,settings);var isEvaluating,imports=defaults({},options.imports,settings.imports),importsKeys=keys(imports),importsValues=values(imports),index=0,interpolate=options.interpolate||reNoMatch,source="__p += '",reDelimiters=RegExp((options.escape||reNoMatch).source+"|"+interpolate.source+"|"+(interpolate===reInterpolate?reEsTemplate:reNoMatch).source+"|"+(options.evaluate||reNoMatch).source+"|$","g");text.replace(reDelimiters,function(match,escapeValue,interpolateValue,esTemplateValue,evaluateValue,offset){return interpolateValue||(interpolateValue=esTemplateValue),source+=text.slice(index,offset).replace(reUnescapedString,escapeStringChar),escapeValue&&(source+="' +\n__e("+escapeValue+") +\n'"),evaluateValue&&(isEvaluating=!0,source+="';\n"+evaluateValue+";\n__p += '"),interpolateValue&&(source+="' +\n((__t = ("+interpolateValue+")) == null ? '' : __t) +\n'"),index=offset+match.length,match}),source+="';\n";var variable=options.variable,hasVariable=variable;hasVariable||(variable="obj",source="with ("+variable+") {\n"+source+"\n}\n"),source=(isEvaluating?source.replace(reEmptyStringLeading,""):source).replace(reEmptyStringMiddle,"$1").replace(reEmptyStringTrailing,"$1;"),source="function("+variable+") {\n"+(hasVariable?"":variable+" || ("+variable+" = {});\n")+"var __t, __p = '', __e = _.escape"+(isEvaluating?", __j = Array.prototype.join;\nfunction print() { __p += __j.call(arguments, '') }\n":";\n")+source+"return __p\n}";try{var result=Function(importsKeys,"return "+source).apply(void 0,importsValues)}catch(e){throw e.source=source,e}return data?result(data):(result.source=source,result)}var defaults=__webpack_require__(84),escapeStringChar=(__webpack_require__(85),__webpack_require__(86)),keys=__webpack_require__(87),reInterpolate=__webpack_require__(88),templateSettings=__webpack_require__(89),values=__webpack_require__(90),reEmptyStringLeading=/\b__p \+= '';/g,reEmptyStringMiddle=/\b(__p \+=) '' \+/g,reEmptyStringTrailing=/(__e\(.*?\)|\b__t\)) \+\n'';/g,reEsTemplate=/\$\{([^\\}]*(?:\\.[^\\}]*)*)\}/g,reNoMatch=/($^)/,reUnescapedString=/['\n\r\t\u2028\u2029\\]/g;module.exports=template},function(module,exports,__webpack_require__){function uniqueId(prefix){var id=++idCounter;return String(null==prefix?"":prefix)+id}var idCounter=0;module.exports=uniqueId},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;!function(root,factory){__WEBPACK_AMD_DEFINE_RESULT__=function(){return root.Eventable=factory()}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))}(this,function(){function once(func){var memo,times=2;return function(){return--times>0?memo=func.apply(this,arguments):func=null,memo}}function addListenMethod(method,implementation){Eventable[method]=function(obj,name,callback){var listeners=this._listeners||(this._listeners={}),id=obj._listenerId||(obj._listenerId=(new Date).getTime());return listeners[id]=obj,"object"==typeof name&&(callback=this),obj[implementation](name,callback,this),this}}var array=[],slice=array.slice,Eventable={on:function(name,callback,context){if(!eventsApi(this,"on",name,[callback,context])||!callback)return this;this._events||(this._events={});var events=this._events[name]||(this._events[name]=[]);return events.push({callback:callback,context:context,ctx:context||this}),this},once:function(name,callback,context){if(!eventsApi(this,"once",name,[callback,context])||!callback)return this;var self=this,func=once(function(){self.off(name,func),callback.apply(this,arguments)});return func._callback=callback,this.on(name,func,context)},off:function(name,callback,context){var retain,ev,events,names,i,l,j,k;if(!this._events||!eventsApi(this,"off",name,[callback,context]))return this;if(!name&&!callback&&!context)return this._events={},this;for(names=name?[name]:Object.keys(this._events),i=0,l=names.length;l>i;i++)if(name=names[i],events=this._events[name]){if(this._events[name]=retain=[],callback||context)for(j=0,k=events.length;k>j;j++)ev=events[j],(callback&&callback!==ev.callback&&callback!==ev.callback._callback||context&&context!==ev.context)&&retain.push(ev);retain.length||delete this._events[name]}return this},trigger:function(name){if(!this._events)return this;var args=slice.call(arguments,1);if(!eventsApi(this,"trigger",name,args))return this;var events=this._events[name],allEvents=this._events.all;return events&&triggerEvents(events,args),allEvents&&triggerEvents(allEvents,arguments),this},stopListening:function(obj,name,callback){var listeners=this._listeners;if(!listeners)return this;var deleteListener=!name&&!callback;"object"==typeof name&&(callback=this),obj&&((listeners={})[obj._listenerId]=obj);for(var id in listeners)listeners[id].off(name,callback,this),deleteListener&&delete this._listeners[id];return this}},eventSplitter=/\s+/,eventsApi=function(obj,action,name,rest){if(!name)return!0;if("object"==typeof name){for(var key in name)obj[action].apply(obj,[key,name[key]].concat(rest));return!1}if(eventSplitter.test(name)){for(var names=name.split(eventSplitter),i=0,l=names.length;l>i;i++)obj[action].apply(obj,[names[i]].concat(rest));return!1}return!0},triggerEvents=function(events,args){var ev,i=-1,l=events.length,a1=args[0],a2=args[1],a3=args[2];switch(args.length){case 0:for(;++i<l;)(ev=events[i]).callback.call(ev.ctx);return;case 1:for(;++i<l;)(ev=events[i]).callback.call(ev.ctx,a1);return;case 2:for(;++i<l;)(ev=events[i]).callback.call(ev.ctx,a1,a2);return;case 3:for(;++i<l;)(ev=events[i]).callback.call(ev.ctx,a1,a2,a3);return;default:for(;++i<l;)(ev=events[i]).callback.apply(ev.ctx,args)}};return addListenMethod("listenTo","on"),addListenMethod("listenToOnce","once"),Eventable.bind=Eventable.on,Eventable.unbind=Eventable.off,Eventable})},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(73),__webpack_require__(74),__webpack_require__(78),__webpack_require__(79),__webpack_require__(80),__webpack_require__(81),__webpack_require__(75),__webpack_require__(76),__webpack_require__(77),__webpack_require__(66),__webpack_require__(67),__webpack_require__(68),__webpack_require__(69),__webpack_require__(70),__webpack_require__(71),__webpack_require__(97),__webpack_require__(72)],__WEBPACK_AMD_DEFINE_RESULT__=function(commands,events,replaceNbspCharsFormatter,enforcePElements,ensureSelectableContainers,escapeHtmlCharactersFormatter,inlineElementsMode,patches,setRootPElement,Api,buildTransactionManager,UndoManager,EventEmitter,elementHelpers,nodeHelpers,Immutable,config){"use strict";function Scribe(el,options){EventEmitter.call(this),this.el=el,this.commands={},this.options=config.checkOptions(options),this.commandPatches={},this._plainTextFormatterFactory=new FormatterFactory,this._htmlFormatterFactory=new HTMLFormatterFactory,this.api=new Api(this),this.node=nodeHelpers,this.element=elementHelpers,this.Immutable=Immutable;var TransactionManager=buildTransactionManager(this);this.transactionManager=new TransactionManager,this.undoManager=!1,this.options.undo.enabled&&(this.undoManager=this.options.undo.manager?this.options.undo.manager:new UndoManager(this.options.undo.limit,this.el),this._merge=!1,this._forceMerge=!1,this._mergeTimer=0,this._lastItem={content:""}),this.setHTML(this.getHTML()),this.el.setAttribute("contenteditable",!0),this.el.addEventListener("input",function(){this.transactionManager.run()}.bind(this),!1),this.allowsBlockElements()?(this.use(setRootPElement()),this.use(enforcePElements()),this.use(ensureSelectableContainers())):this.use(inlineElementsMode());var defaultFormatters=Immutable.List.of(escapeHtmlCharactersFormatter,replaceNbspCharsFormatter),defaultPatches=Immutable.List.of(patches.events),defaultCommandPatches=Immutable.List(this.options.defaultCommandPatches).map(function(patch){return patches.commands[patch]}),defaultCommands=Immutable.List.of("indent","insertList","outdent","redo","subscript","superscript","undo").map(function(command){return commands[command]}),allPlugins=Immutable.List().concat(defaultFormatters,defaultPatches,defaultCommandPatches,defaultCommands);allPlugins.forEach(function(plugin){this.use(plugin())}.bind(this)),this.use(events())}function FormatterFactory(){this.formatters=Immutable.List()}function HTMLFormatterFactory(){this.formatters={sanitize:Immutable.List(),normalize:Immutable.List(),"export":Immutable.List()}}return Scribe.prototype=Object.create(EventEmitter.prototype),Scribe.prototype.use=function(configurePlugin){return configurePlugin(this),this},Scribe.prototype.setHTML=function(html,skipFormatters){this._lastItem.content=html,skipFormatters&&(this._skipFormatters=!0),this.el.innerHTML!==html&&(this.el.innerHTML=html)},Scribe.prototype.getHTML=function(){return this.el.innerHTML},Scribe.prototype.getContent=function(){return this._htmlFormatterFactory.formatForExport(this.getHTML().replace(/<br>$/,""))},Scribe.prototype.getTextContent=function(){return this.el.textContent},Scribe.prototype.pushHistory=function(){var scribe=this;if(scribe.options.undo.enabled){var lastContentNoMarkers=scribe._lastItem.content.replace(/<em class="scribe-marker">/g,"").replace(/<\/em>/g,"");if(scribe.getHTML()!==lastContentNoMarkers){var selection=new scribe.api.Selection;selection.placeMarkers();var content=scribe.getHTML();selection.removeMarkers();var previousItem=scribe.undoManager.item(scribe.undoManager.position);return(scribe._merge||scribe._forceMerge)&&previousItem&&scribe._lastItem==previousItem[0]?scribe._lastItem.content=content:(scribe._lastItem={previousItem:scribe._lastItem,content:content,scribe:scribe,execute:function(){},undo:function(){this.scribe.restoreFromHistory(this.previousItem)},redo:function(){this.scribe.restoreFromHistory(this)}},scribe.undoManager.transact(scribe._lastItem,!1)),clearTimeout(scribe._mergeTimer),scribe._merge=!0,scribe._mergeTimer=setTimeout(function(){scribe._merge=!1},scribe.options.undo.interval),!0}}return!1},Scribe.prototype.getCommand=function(commandName){return this.commands[commandName]||this.commandPatches[commandName]||new this.api.Command(commandName)},Scribe.prototype.restoreFromHistory=function(historyItem){this._lastItem=historyItem,this.setHTML(historyItem.content,!0);var selection=new this.api.Selection;selection.selectMarkers(),this.trigger("content-changed")},Scribe.prototype.allowsBlockElements=function(){return this.options.allowBlockElements},Scribe.prototype.setContent=function(content){this.allowsBlockElements()||(content+="<br>"),this.setHTML(content),this.trigger("content-changed")},Scribe.prototype.insertPlainText=function(plainText){this.insertHTML("<p>"+this._plainTextFormatterFactory.format(plainText)+"</p>")},Scribe.prototype.insertHTML=function(html){this.getCommand("insertHTML").execute(this._htmlFormatterFactory.format(html))},Scribe.prototype.isDebugModeEnabled=function(){return this.options.debug},Scribe.prototype.registerHTMLFormatter=function(phase,formatter){this._htmlFormatterFactory.formatters[phase]=this._htmlFormatterFactory.formatters[phase].push(formatter)},Scribe.prototype.registerPlainTextFormatter=function(formatter){this._plainTextFormatterFactory.formatters=this._plainTextFormatterFactory.formatters.push(formatter)},FormatterFactory.prototype.format=function(html){var formatted=this.formatters.reduce(function(formattedData,formatter){return formatter(formattedData)},html);return formatted},HTMLFormatterFactory.prototype=Object.create(FormatterFactory.prototype),HTMLFormatterFactory.prototype.constructor=HTMLFormatterFactory,HTMLFormatterFactory.prototype.format=function(html){var formatters=this.formatters.sanitize.concat(this.formatters.normalize),formatted=formatters.reduce(function(formattedData,formatter){return formatter(formattedData)},html);return formatted},HTMLFormatterFactory.prototype.formatForExport=function(html){return this.formatters["export"].reduce(function(formattedData,formatter){return formatter(formattedData)},html)},Scribe}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){scribe.registerPlainTextFormatter(function(html){return html.replace(/\n([ \t]*\n)+/g,"</p><p>").replace(/\n/g,"<br>")})}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var linkPromptCommand=new scribe.api.Command("createLink");linkPromptCommand.nodeName="A",linkPromptCommand.execute=function(){var selection=new scribe.api.Selection,range=selection.range,anchorNode=selection.getContaining(function(node){return node.nodeName===this.nodeName}.bind(this)),initialLink=anchorNode?anchorNode.href:"",link=window.prompt("Enter a link.",initialLink);if(anchorNode&&(range.selectNode(anchorNode),selection.selection.removeAllRanges(),selection.selection.addRange(range)),link){var urlProtocolRegExp=/^https?\:\/\//,mailtoProtocolRegExp=/^mailto\:/;if(!urlProtocolRegExp.test(link)&&!mailtoProtocolRegExp.test(link))if(/@/.test(link)){var shouldPrefixEmail=window.confirm("The URL you entered appears to be an email address. Do you want to add the required “mailto:” prefix?");shouldPrefixEmail&&(link="mailto:"+link)}else{var shouldPrefixLink=window.confirm("The URL you entered appears to be a link. Do you want to add the required “http://” prefix?");shouldPrefixLink&&(link="http://"+link)}scribe.api.SimpleCommand.prototype.execute.call(this,link)}},linkPromptCommand.queryState=function(){var selection=new scribe.api.Selection;return!!selection.getContaining(function(node){return node.nodeName===this.nodeName}.bind(this))},scribe.commands.linkPrompt=linkPromptCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){!function(root,factory){module.exports=factory()}(this,function(){"use strict";function createEl(tag,prop){var n,el=document.createElement(tag||"div");for(n in prop)el[n]=prop[n];return el}function ins(parent){for(var i=1,n=arguments.length;n>i;i++)parent.appendChild(arguments[i]);return parent}function addAnimation(alpha,trail,i,lines){var name=["opacity",trail,~~(100*alpha),i,lines].join("-"),start=.01+i/lines*100,z=Math.max(1-(1-alpha)/trail*(100-start),alpha),prefix=useCssAnimations.substring(0,useCssAnimations.indexOf("Animation")).toLowerCase(),pre=prefix&&"-"+prefix+"-"||"";return animations[name]||(sheet.insertRule("@"+pre+"keyframes "+name+"{0%{opacity:"+z+"}"+start+"%{opacity:"+alpha+"}"+(start+.01)+"%{opacity:1}"+(start+trail)%100+"%{opacity:"+alpha+"}100%{opacity:"+z+"}}",sheet.cssRules.length),animations[name]=1),name}function vendor(el,prop){var pp,i,s=el.style;for(prop=prop.charAt(0).toUpperCase()+prop.slice(1),i=0;i<prefixes.length;i++)if(pp=prefixes[i]+prop,void 0!==s[pp])return pp;return void 0!==s[prop]?prop:void 0}function css(el,prop){for(var n in prop)el.style[vendor(el,n)||n]=prop[n];return el}function merge(obj){for(var i=1;i<arguments.length;i++){var def=arguments[i];for(var n in def)void 0===obj[n]&&(obj[n]=def[n])}return obj}function getColor(color,idx){return"string"==typeof color?color:color[idx%color.length]}function Spinner(o){this.opts=merge(o||{},Spinner.defaults,defaults)}function initVML(){function vml(tag,attr){return createEl("<"+tag+' xmlns="urn:schemas-microsoft.com:vml" class="spin-vml">',attr)}sheet.addRule(".spin-vml","behavior:url(#default#VML)"),Spinner.prototype.lines=function(el,o){function grp(){return css(vml("group",{coordsize:s+" "+s,coordorigin:-r+" "+-r}),{width:s,height:s})}function seg(i,dx,filter){ins(g,ins(css(grp(),{rotation:360/o.lines*i+"deg",left:~~dx}),ins(css(vml("roundrect",{arcsize:o.corners}),{width:r,height:o.width,left:o.radius,top:-o.width>>1,filter:filter}),vml("fill",{color:getColor(o.color,i),opacity:o.opacity}),vml("stroke",{opacity:0}))))}var i,r=o.length+o.width,s=2*r,margin=2*-(o.width+o.length)+"px",g=css(grp(),{position:"absolute",top:margin,left:margin});if(o.shadow)for(i=1;i<=o.lines;i++)seg(i,-2,"progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)");for(i=1;i<=o.lines;i++)seg(i);return ins(el,g)},Spinner.prototype.opacity=function(el,i,val,o){var c=el.firstChild;o=o.shadow&&o.lines||0,c&&i+o<c.childNodes.length&&(c=c.childNodes[i+o],c=c&&c.firstChild,c=c&&c.firstChild,c&&(c.opacity=val))}}var useCssAnimations,prefixes=["webkit","Moz","ms","O"],animations={},sheet=function(){var el=createEl("style",{type:"text/css"});return ins(document.getElementsByTagName("head")[0],el),el.sheet||el.styleSheet}(),defaults={lines:12,length:7,width:5,radius:10,rotate:0,corners:1,color:"#000",direction:1,speed:1,trail:100,opacity:.25,fps:20,zIndex:2e9,className:"spinner",top:"50%",left:"50%",position:"absolute"};Spinner.defaults={},merge(Spinner.prototype,{spin:function(target){this.stop();var self=this,o=self.opts,el=self.el=css(createEl(0,{className:o.className}),{position:o.position,width:0,zIndex:o.zIndex});if(css(el,{left:o.left,top:o.top}),target&&target.insertBefore(el,target.firstChild||null),el.setAttribute("role","progressbar"),self.lines(el,self.opts),!useCssAnimations){var alpha,i=0,start=(o.lines-1)*(1-o.direction)/2,fps=o.fps,f=fps/o.speed,ostep=(1-o.opacity)/(f*o.trail/100),astep=f/o.lines;!function anim(){i++;for(var j=0;j<o.lines;j++)alpha=Math.max(1-(i+(o.lines-j)*astep)%f*ostep,o.opacity),self.opacity(el,j*o.direction+start,alpha,o);self.timeout=self.el&&setTimeout(anim,~~(1e3/fps))}()}return self},stop:function(){var el=this.el;return el&&(clearTimeout(this.timeout),el.parentNode&&el.parentNode.removeChild(el),this.el=void 0),this},lines:function(el,o){function fill(color,shadow){return css(createEl(),{position:"absolute",width:o.length+o.width+"px",height:o.width+"px",background:color,boxShadow:shadow,transformOrigin:"left",transform:"rotate("+~~(360/o.lines*i+o.rotate)+"deg) translate("+o.radius+"px,0)",borderRadius:(o.corners*o.width>>1)+"px"})}for(var seg,i=0,start=(o.lines-1)*(1-o.direction)/2;i<o.lines;i++)seg=css(createEl(),{position:"absolute",top:1+~(o.width/2)+"px",transform:o.hwaccel?"translate3d(0,0,0)":"",opacity:o.opacity,animation:useCssAnimations&&addAnimation(o.opacity,o.trail,start+i*o.direction,o.lines)+" "+1/o.speed+"s linear infinite"}),o.shadow&&ins(seg,css(fill("#000","0 0 4px #000"),{top:"2px"})),ins(el,ins(seg,fill(getColor(o.color,i),"0 0 1px rgba(0,0,0,.1)")));return el},opacity:function(el,i,val){i<el.childNodes.length&&(el.childNodes[i].style.opacity=val)}});var probe=css(createEl("group"),{behavior:"url(#default#VML)"});return!vendor(probe,"transform")&&probe.adj?initVML():useCssAnimations=vendor(probe,"animation"),Spinner})},function(module,exports,__webpack_require__){"use strict";var has=Object.prototype.hasOwnProperty,toStr=Object.prototype.toString,isArgs=__webpack_require__(91),hasDontEnumBug=!{toString:null}.propertyIsEnumerable("toString"),hasProtoEnumBug=function(){}.propertyIsEnumerable("prototype"),dontEnums=["toString","toLocaleString","valueOf","hasOwnProperty","isPrototypeOf","propertyIsEnumerable","constructor"],keysShim=function(object){var isObject=null!==object&&"object"==typeof object,isFunction="[object Function]"===toStr.call(object),isArguments=isArgs(object),isString=isObject&&"[object String]"===toStr.call(object),theKeys=[];if(!isObject&&!isFunction&&!isArguments)throw new TypeError("Object.keys called on a non-object");var skipProto=hasProtoEnumBug&&isFunction;if(isString&&object.length>0&&!has.call(object,0))for(var i=0;i<object.length;++i)theKeys.push(String(i));if(isArguments&&object.length>0)for(var j=0;j<object.length;++j)theKeys.push(String(j));else for(var name in object)skipProto&&"prototype"===name||!has.call(object,name)||theKeys.push(String(name));if(hasDontEnumBug)for(var ctor=object.constructor,skipConstructor=ctor&&ctor.prototype===object,k=0;k<dontEnums.length;++k)skipConstructor&&"constructor"===dontEnums[k]||!has.call(object,dontEnums[k])||theKeys.push(dontEnums[k]);return theKeys};keysShim.shim=function(){return Object.keys||(Object.keys=keysShim),Object.keys||keysShim},module.exports=keysShim},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(92),__webpack_require__(93),__webpack_require__(94),__webpack_require__(95),__webpack_require__(96)],__WEBPACK_AMD_DEFINE_RESULT__=function(buildCommandPatch,buildCommand,Node,buildSelection,buildSimpleCommand){"use strict";return function(scribe){this.CommandPatch=buildCommandPatch(scribe),this.Command=buildCommand(scribe),this.Node=Node,this.Selection=buildSelection(scribe),this.SimpleCommand=buildSimpleCommand(this,scribe)}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(121)],__WEBPACK_AMD_DEFINE_RESULT__=function(assign){"use strict";return function(scribe){function TransactionManager(){this.history=[]}return assign(TransactionManager.prototype,{start:function(){this.history.push(1)},end:function(){this.history.pop(),0===this.history.length&&(scribe.pushHistory(),scribe.trigger("content-changed"))},run:function(transaction,forceMerge){this.start();try{transaction&&transaction()}finally{scribe._forceMerge=forceMerge===!0,this.end(),scribe._forceMerge=!1}}}),TransactionManager}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";function UndoManager(limit,undoScopeHost){this._stack=[],this._limit=limit,this._fireEvent="undefined"!=typeof CustomEvent&&undoScopeHost&&undoScopeHost.dispatchEvent,this._ush=undoScopeHost,this.position=0,this.length=0}return UndoManager.prototype.transact=function(transaction,merge){if(arguments.length<2)throw new TypeError("Not enough arguments to UndoManager.transact.");transaction.execute(),this._stack.splice(0,this.position),merge&&this.length?this._stack[0].push(transaction):this._stack.unshift([transaction]),this.position=0,this.length=this._limit&&this._stack.length>this._limit?this._stack.length=this._limit:this._stack.length,this._fireEvent&&this._ush.dispatchEvent(new CustomEvent("DOMTransaction",{detail:{transactions:this._stack[0].slice()},bubbles:!0,cancelable:!1}))},UndoManager.prototype.undo=function(){if(this.position<this.length){for(var i=this._stack[this.position].length-1;i>=0;i--)this._stack[this.position][i].undo();this.position++,this._fireEvent&&this._ush.dispatchEvent(new CustomEvent("undo",{detail:{transactions:this._stack[this.position-1].slice()},bubbles:!0,cancelable:!1}))}},UndoManager.prototype.redo=function(){if(this.position>0){for(var i=0,n=this._stack[this.position-1].length;n>i;i++)this._stack[this.position-1][i].redo();this.position--,this._fireEvent&&this._ush.dispatchEvent(new CustomEvent("redo",{detail:{transactions:this._stack[this.position].slice()},bubbles:!0,cancelable:!1}))}},UndoManager.prototype.item=function(index){return index>=0&&index<this.length?this._stack[index].slice():null},UndoManager.prototype.clearUndo=function(){this._stack.length=this.length=this.position},UndoManager.prototype.clearRedo=function(){this._stack.splice(0,this.position),this.position=0,this.length=this._stack.length},UndoManager}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(123),__webpack_require__(97)],__WEBPACK_AMD_DEFINE_RESULT__=function(pull,Immutable){"use strict";function EventEmitter(){this._listeners={}}return EventEmitter.prototype.on=function(eventName,fn){var listeners=this._listeners[eventName]||Immutable.Set();this._listeners[eventName]=listeners.add(fn)},EventEmitter.prototype.off=function(eventName,fn){var listeners=this._listeners[eventName]||Immutable.Set();listeners=fn?listeners["delete"](fn):listeners.clear()},EventEmitter.prototype.trigger=function(eventName,args){for(var events=eventName.split(":");events.length;){var currentEvent=events.join(":"),listeners=this._listeners[currentEvent]||Immutable.Set();listeners.forEach(function(listener){listener.apply(null,args)}),events.splice(events.length-1,1)}},EventEmitter}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),
!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(125)],__WEBPACK_AMD_DEFINE_RESULT__=function(contains){"use strict";function isBlockElement(node){return contains(blockElementNames,node.nodeName)}function isSelectionMarkerNode(node){return node.nodeType===Node.ELEMENT_NODE&&"scribe-marker"===node.className}function isCaretPositionNode(node){return node.nodeType===Node.ELEMENT_NODE&&"caret-position"===node.className}function unwrap(node,childNode){for(;childNode.childNodes.length>0;)node.insertBefore(childNode.childNodes[0],childNode);node.removeChild(childNode)}var blockElementNames=["ADDRESS","ARTICLE","ASIDE","AUDIO","BLOCKQUOTE","CANVAS","DD","DIV","FIELDSET","FIGCAPTION","FIGURE","FOOTER","FORM","H1","H2","H3","H4","H5","H6","HEADER","HGROUP","HR","LI","NOSCRIPT","OL","OUTPUT","P","PRE","SECTION","TABLE","TD","TH","TFOOT","UL","VIDEO"];return{isBlockElement:isBlockElement,isSelectionMarkerNode:isSelectionMarkerNode,isCaretPositionNode:isCaretPositionNode,unwrap:unwrap}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";function isEmptyTextNode(node){return node.nodeType===Node.TEXT_NODE&&""===node.textContent}function insertAfter(newNode,referenceNode){return referenceNode.parentNode.insertBefore(newNode,referenceNode.nextSibling)}function removeNode(node){return node.parentNode.removeChild(node)}return{isEmptyTextNode:isEmptyTextNode,insertAfter:insertAfter,removeNode:removeNode}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(122)],__WEBPACK_AMD_DEFINE_RESULT__=function(defaults){function checkOptions(userSuppliedOptions){var options=userSuppliedOptions||{};return Object.freeze(defaults(options,defaultOptions))}var defaultOptions={allowBlockElements:!0,debug:!1,undo:{manager:!1,enabled:!0,limit:100,interval:250},defaultCommandPatches:["bold","indent","insertHTML","insertList","outdent","createLink"]};return{defaultOptions:defaultOptions,checkOptions:checkOptions}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(98),__webpack_require__(99),__webpack_require__(100),__webpack_require__(101),__webpack_require__(102),__webpack_require__(103),__webpack_require__(104)],__WEBPACK_AMD_DEFINE_RESULT__=function(indent,insertList,outdent,redo,subscript,superscript,undo){"use strict";return{indent:indent,insertList:insertList,outdent:outdent,redo:redo,subscript:subscript,superscript:superscript,undo:undo}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(125),__webpack_require__(105)],__WEBPACK_AMD_DEFINE_RESULT__=function(contains,observeDomChanges){"use strict";return function(){return function(scribe){scribe.el.addEventListener("focus",function(){function getFirstDeepestChild(node){var treeWalker=document.createTreeWalker(node,NodeFilter.SHOW_ALL,null,!1),previousNode=treeWalker.currentNode;return treeWalker.firstChild()?"BR"===treeWalker.currentNode.nodeName?previousNode:getFirstDeepestChild(treeWalker.currentNode):treeWalker.currentNode}var selection=new scribe.api.Selection;if(selection.range){var isFirefoxBug=scribe.allowsBlockElements()&&selection.range.startContainer===scribe.el;if(isFirefoxBug){var focusElement=getFirstDeepestChild(scribe.el.firstChild),range=selection.range;range.setStart(focusElement,0),range.setEnd(focusElement,0),selection.selection.removeAllRanges(),selection.selection.addRange(range)}}}.bind(scribe));var applyFormatters=function(){if(!scribe._skipFormatters){var selection=new scribe.api.Selection,isEditorActive=selection.range,runFormatters=function(){isEditorActive&&selection.placeMarkers(),scribe.setHTML(scribe._htmlFormatterFactory.format(scribe.getHTML())),selection.selectMarkers()}.bind(scribe);scribe.transactionManager.run(runFormatters)}delete scribe._skipFormatters}.bind(scribe);observeDomChanges(scribe.el,applyFormatters),scribe.allowsBlockElements()&&scribe.el.addEventListener("keydown",function(event){if(13===event.keyCode){var selection=new scribe.api.Selection,range=selection.range,headingNode=selection.getContaining(function(node){return/^(H[1-6])$/.test(node.nodeName)});if(headingNode&&range.collapsed){var contentToEndRange=range.cloneRange();contentToEndRange.setEndAfter(headingNode,0);var contentToEndFragment=contentToEndRange.cloneContents();""===contentToEndFragment.firstChild.textContent&&(event.preventDefault(),scribe.transactionManager.run(function(){var pNode=document.createElement("p"),brNode=document.createElement("br");pNode.appendChild(brNode),headingNode.parentNode.insertBefore(pNode,headingNode.nextElementSibling),range.setStart(pNode,0),range.setEnd(pNode,0),selection.selection.removeAllRanges(),selection.selection.addRange(range)}))}}}),scribe.allowsBlockElements()&&scribe.el.addEventListener("keydown",function(event){if(13===event.keyCode||8===event.keyCode){var selection=new scribe.api.Selection,range=selection.range;if(range.collapsed){var containerLIElement=selection.getContaining(function(node){return"LI"===node.nodeName});if(containerLIElement&&""===containerLIElement.textContent.trim()){event.preventDefault();var listNode=selection.getContaining(function(node){return"UL"===node.nodeName||"OL"===node.nodeName}),command=scribe.getCommand("OL"===listNode.nodeName?"insertOrderedList":"insertUnorderedList");command.execute()}}}}),scribe.el.addEventListener("paste",function(event){if(event.clipboardData)event.preventDefault(),contains(event.clipboardData.types,"text/html")?scribe.insertHTML(event.clipboardData.getData("text/html")):scribe.insertPlainText(event.clipboardData.getData("text/plain"));else{var selection=new scribe.api.Selection;selection.placeMarkers();var bin=document.createElement("div");document.body.appendChild(bin),bin.setAttribute("contenteditable",!0),bin.focus(),setTimeout(function(){var data=bin.innerHTML;bin.parentNode.removeChild(bin),selection.selectMarkers(),scribe.el.focus(),scribe.insertHTML(data)},1)}})}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";function hasContent(rootNode){for(var treeWalker=document.createTreeWalker(rootNode,NodeFilter.SHOW_ALL,null,!1);treeWalker.nextNode();)if(treeWalker.currentNode&&(~["br"].indexOf(treeWalker.currentNode.nodeName.toLowerCase())||treeWalker.currentNode.length>0))return!0;return!1}return function(){return function(scribe){scribe.el.addEventListener("keydown",function(event){if(13===event.keyCode){var selection=new scribe.api.Selection,range=selection.range,blockNode=selection.getContaining(function(node){return"LI"===node.nodeName||/^(H[1-6])$/.test(node.nodeName)});blockNode||(event.preventDefault(),scribe.transactionManager.run(function(){"BR"===scribe.el.lastChild.nodeName&&scribe.el.removeChild(scribe.el.lastChild);var brNode=document.createElement("br");range.insertNode(brNode),range.collapse(!1);var contentToEndRange=range.cloneRange();contentToEndRange.setEndAfter(scribe.el.lastChild,0);var contentToEndFragment=contentToEndRange.cloneContents();if(!hasContent(contentToEndFragment)){var bogusBrNode=document.createElement("br");range.insertNode(bogusBrNode)}var newRange=range.cloneRange();newRange.setStartAfter(brNode,0),newRange.setEndAfter(brNode,0),selection.selection.removeAllRanges(),selection.selection.addRange(newRange)}))}}.bind(this)),""===scribe.getHTML().trim()&&scribe.setContent("")}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(106),__webpack_require__(107),__webpack_require__(108),__webpack_require__(109),__webpack_require__(110),__webpack_require__(111),__webpack_require__(112)],__WEBPACK_AMD_DEFINE_RESULT__=function(boldCommand,indentCommand,insertHTMLCommand,insertListCommands,outdentCommand,createLinkCommand,events){"use strict";return{commands:{bold:boldCommand,indent:indentCommand,insertHTML:insertHTMLCommand,insertList:insertListCommands,outdent:outdentCommand,createLink:createLinkCommand},events:events}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){""===scribe.getHTML().trim()&&scribe.setContent("<p><br></p>")}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var nbspCharRegExp=/(\s|&nbsp;)+/g;scribe.registerHTMLFormatter("export",function(html){return html.replace(nbspCharRegExp," ")})}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(124)],__WEBPACK_AMD_DEFINE_RESULT__=function(last){"use strict";function wrapChildNodes(scribe,parentNode){var groups=Array.prototype.reduce.call(parentNode.childNodes,function(accumulator,binChildNode){function startNewGroup(){var newGroup=[binChildNode];accumulator.push(newGroup)}var group=last(accumulator);if(group){var isBlockGroup=scribe.element.isBlockElement(group[0]);isBlockGroup===scribe.element.isBlockElement(binChildNode)?group.push(binChildNode):startNewGroup()}else startNewGroup();return accumulator},[]),consecutiveInlineElementsAndTextNodes=groups.filter(function(group){var isBlockGroup=scribe.element.isBlockElement(group[0]);return!isBlockGroup});consecutiveInlineElementsAndTextNodes.forEach(function(nodes){var pElement=document.createElement("p");nodes[0].parentNode.insertBefore(pElement,nodes[0]),nodes.forEach(function(node){pElement.appendChild(node)})}),parentNode._isWrapped=!0}function traverse(scribe,parentNode){for(var treeWalker=document.createTreeWalker(parentNode,NodeFilter.SHOW_ELEMENT,null,!1),node=treeWalker.firstChild();node;){if("BLOCKQUOTE"===node.nodeName&&!node._isWrapped){wrapChildNodes(scribe,node),traverse(scribe,parentNode);break}node=treeWalker.nextSibling()}}return function(){return function(scribe){scribe.registerHTMLFormatter("normalize",function(html){var bin=document.createElement("div");return bin.innerHTML=html,wrapChildNodes(scribe,bin),traverse(scribe,bin),bin.innerHTML})}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(70),__webpack_require__(125)],__WEBPACK_AMD_DEFINE_RESULT__=function(element,contains){"use strict";function parentHasNoTextContent(element,node){return element.isCaretPositionNode(node)?!0:""===node.parentNode.textContent.trim()}function traverse(element,parentNode){function isEmpty(node){return 0===node.children.length&&element.isBlockElement(node)||1===node.children.length&&element.isSelectionMarkerNode(node.children[0])?!0:element.isBlockElement(node)||0!==node.children.length?!1:parentHasNoTextContent(element,node)}for(var node=parentNode.firstElementChild;node;)element.isSelectionMarkerNode(node)||(isEmpty(node)&&""===node.textContent.trim()&&!contains(html5VoidElements,node.nodeName)?node.appendChild(document.createElement("br")):node.children.length>0&&traverse(element,node)),node=node.nextElementSibling}var html5VoidElements=["AREA","BASE","BR","COL","COMMAND","EMBED","HR","IMG","INPUT","KEYGEN","LINK","META","PARAM","SOURCE","TRACK","WBR"];return function(){return function(scribe){scribe.registerHTMLFormatter("normalize",function(html){var bin=document.createElement("div");return bin.innerHTML=html,traverse(scribe.element,bin),bin.innerHTML})}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(126)],__WEBPACK_AMD_DEFINE_RESULT__=function(escape){"use strict";return function(){return function(scribe){scribe.registerPlainTextFormatter(escape)}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var baseCreateCallback=__webpack_require__(113),keys=__webpack_require__(114),objectTypes=__webpack_require__(115),forOwn=function(collection,callback,thisArg){var index,iterable=collection,result=iterable;if(!iterable)return result;if(!objectTypes[typeof iterable])return result;callback=callback&&"undefined"==typeof thisArg?callback:baseCreateCallback(callback,thisArg,3);for(var ownIndex=-1,ownProps=objectTypes[typeof iterable]&&keys(iterable),length=ownProps?ownProps.length:0;++ownIndex<length;)if(index=ownProps[ownIndex],callback(iterable[index],index,collection)===!1)return result;return result};module.exports=forOwn},function(module,exports,__webpack_require__){var objectTypes={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1};module.exports=objectTypes},function(module,exports,__webpack_require__){var keys=__webpack_require__(87),objectTypes=__webpack_require__(116),defaults=function(object,source,guard){var index,iterable=object,result=iterable;if(!iterable)return result;for(var args=arguments,argsIndex=0,argsLength="number"==typeof guard?2:args.length;++argsIndex<argsLength;)if(iterable=args[argsIndex],iterable&&objectTypes[typeof iterable])for(var ownIndex=-1,ownProps=objectTypes[typeof iterable]&&keys(iterable),length=ownProps?ownProps.length:0;++ownIndex<length;)index=ownProps[ownIndex],"undefined"==typeof result[index]&&(result[index]=iterable[index]);return result};module.exports=defaults},function(module,exports,__webpack_require__){function escape(string){return null==string?"":String(string).replace(reUnescapedHtml,escapeHtmlChar)}var escapeHtmlChar=__webpack_require__(117),reUnescapedHtml=(__webpack_require__(87),__webpack_require__(118));module.exports=escape},function(module,exports,__webpack_require__){function escapeStringChar(match){return"\\"+stringEscapes[match]}var stringEscapes={"\\":"\\","'":"'","\n":"n","\r":"r","	":"t","\u2028":"u2028","\u2029":"u2029"};module.exports=escapeStringChar},function(module,exports,__webpack_require__){var isNative=__webpack_require__(119),isObject=__webpack_require__(54),shimKeys=__webpack_require__(120),nativeKeys=isNative(nativeKeys=Object.keys)&&nativeKeys,keys=nativeKeys?function(object){return isObject(object)?nativeKeys(object):[]}:shimKeys;module.exports=keys},function(module,exports,__webpack_require__){var reInterpolate=/<%=([\s\S]+?)%>/g;module.exports=reInterpolate},function(module,exports,__webpack_require__){var escape=__webpack_require__(85),reInterpolate=__webpack_require__(88),templateSettings={escape:/<%-([\s\S]+?)%>/g,evaluate:/<%([\s\S]+?)%>/g,interpolate:reInterpolate,variable:"",imports:{_:{escape:escape}}};module.exports=templateSettings},function(module,exports,__webpack_require__){function values(object){for(var index=-1,props=keys(object),length=props.length,result=Array(length);++index<length;)result[index]=object[props[index]];return result}var keys=__webpack_require__(87);module.exports=values},function(module,exports,__webpack_require__){"use strict";var toStr=Object.prototype.toString;module.exports=function(value){var str=toStr.call(value),isArgs="[object Arguments]"===str;return isArgs||(isArgs="[object Array]"!==str&&null!==value&&"object"==typeof value&&"number"==typeof value.length&&value.length>=0&&"[object Function]"===toStr.call(value.callee)),isArgs}},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(scribe){function CommandPatch(commandName){this.commandName=commandName}return CommandPatch.prototype.execute=function(value){scribe.transactionManager.run(function(){document.execCommand(this.commandName,!1,value||null)}.bind(this))},CommandPatch.prototype.queryState=function(){return document.queryCommandState(this.commandName)},CommandPatch.prototype.queryEnabled=function(){return document.queryCommandEnabled(this.commandName)},CommandPatch}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(scribe){function Command(commandName){this.commandName=commandName,this.patch=scribe.commandPatches[this.commandName]}return Command.prototype.execute=function(value){this.patch?this.patch.execute(value):scribe.transactionManager.run(function(){document.execCommand(this.commandName,!1,value||null)}.bind(this))},Command.prototype.queryState=function(){return this.patch?this.patch.queryState():document.queryCommandState(this.commandName)},Command.prototype.queryEnabled=function(){return this.patch?this.patch.queryEnabled():document.queryCommandEnabled(this.commandName)},Command}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";function Node(node){this.node=node}return Node.prototype.getAncestor=function(rootElement,nodeFilter){var isTopContainerElement=function(element){return rootElement===element};if(!isTopContainerElement(this.node))for(var currentNode=this.node.parentNode;currentNode&&!isTopContainerElement(currentNode);){if(nodeFilter(currentNode))return currentNode;currentNode=currentNode.parentNode}},Node.prototype.nextAll=function(){for(var all=[],el=this.node.nextSibling;el;)all.push(el),el=el.nextSibling;return all},Node}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(70)],__WEBPACK_AMD_DEFINE_RESULT__=function(elementHelper){"use strict";return function(scribe){function Selection(){for(var rootDoc=document,currentElement=scribe.el.parentNode;currentElement&&currentElement.nodeType!==Node.DOCUMENT_FRAGMENT_NODE&&currentElement.nodeType!==Node.DOCUMENT_NODE;)currentElement=currentElement.parentNode;if(currentElement&&currentElement.nodeType===Node.DOCUMENT_FRAGMENT_NODE&&currentElement.getSelection&&(rootDoc=currentElement),this.selection=rootDoc.getSelection(),this.selection.rangeCount&&this.selection.anchorNode){this.range=document.createRange();var reverseRange=document.createRange();this.range.setStart(this.selection.anchorNode,this.selection.anchorOffset),reverseRange.setStart(this.selection.focusNode,this.selection.focusOffset),this.range.compareBoundaryPoints(Range.START_TO_START,reverseRange)<=0?this.range.setEnd(this.selection.focusNode,this.selection.focusOffset):(this.range=reverseRange,this.range.setEnd(this.selection.anchorNode,this.selection.anchorOffset))}}return Selection.prototype.getContaining=function(nodeFilter){var range=this.range;if(range){var node=new scribe.api.Node(this.range.commonAncestorContainer),isTopContainerElement=node.node&&scribe.el===node.node;return!isTopContainerElement&&nodeFilter(node.node)?node.node:node.getAncestor(scribe.el,nodeFilter)}},Selection.prototype.placeMarkers=function(){var range=this.range;if(range&&scribe.el.offsetParent){var scribeNodeRange=document.createRange();scribeNodeRange.selectNodeContents(scribe.el);var selectionStartWithinScribeElementStart=this.range.compareBoundaryPoints(Range.START_TO_START,scribeNodeRange)>=0,selectionEndWithinScribeElementEnd=this.range.compareBoundaryPoints(Range.END_TO_END,scribeNodeRange)<=0;if(selectionStartWithinScribeElementStart&&selectionEndWithinScribeElementEnd){var startMarker=document.createElement("em");startMarker.classList.add("scribe-marker");var endMarker=document.createElement("em");endMarker.classList.add("scribe-marker");var rangeEnd=this.range.cloneRange();if(rangeEnd.collapse(!1),rangeEnd.insertNode(endMarker),endMarker.nextSibling&&endMarker.nextSibling.nodeType===Node.TEXT_NODE&&""===endMarker.nextSibling.data&&endMarker.parentNode.removeChild(endMarker.nextSibling),endMarker.previousSibling&&endMarker.previousSibling.nodeType===Node.TEXT_NODE&&""===endMarker.previousSibling.data&&endMarker.parentNode.removeChild(endMarker.previousSibling),!this.range.collapsed){var rangeStart=this.range.cloneRange();rangeStart.collapse(!0),rangeStart.insertNode(startMarker),startMarker.nextSibling&&startMarker.nextSibling.nodeType===Node.TEXT_NODE&&""===startMarker.nextSibling.data&&startMarker.parentNode.removeChild(startMarker.nextSibling),startMarker.previousSibling&&startMarker.previousSibling.nodeType===Node.TEXT_NODE&&""===startMarker.previousSibling.data&&startMarker.parentNode.removeChild(startMarker.previousSibling)}this.selection.removeAllRanges(),this.selection.addRange(this.range)}}},Selection.prototype.getMarkers=function(){return scribe.el.querySelectorAll("em.scribe-marker")},Selection.prototype.removeMarkers=function(){var markers=this.getMarkers();Array.prototype.forEach.call(markers,function(marker){marker.parentNode.removeChild(marker)})},Selection.prototype.selectMarkers=function(keepMarkers){var markers=this.getMarkers();if(markers.length){var newRange=document.createRange();newRange.setStartBefore(markers[0]),newRange.setEndAfter(markers.length>=2?markers[1]:markers[0]),keepMarkers||this.removeMarkers(),this.selection.removeAllRanges(),this.selection.addRange(newRange)}},Selection.prototype.isCaretOnNewLine=function(){function isEmptyInlineElement(node){for(var treeWalker=document.createTreeWalker(node,NodeFilter.SHOW_ELEMENT,null,!1),currentNode=treeWalker.root;currentNode;){var numberOfChildren=currentNode.childNodes.length;if(numberOfChildren>1||1===numberOfChildren&&""!==currentNode.textContent.trim())return!1;if(0===numberOfChildren)return""===currentNode.textContent.trim();currentNode=treeWalker.nextNode()}}var containerPElement=this.getContaining(function(node){return"P"===node.nodeName});return containerPElement?isEmptyInlineElement(containerPElement):!1},Selection}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(api,scribe){function SimpleCommand(commandName,nodeName){scribe.api.Command.call(this,commandName),this._nodeName=nodeName}return SimpleCommand.prototype=Object.create(api.Command.prototype),SimpleCommand.prototype.constructor=SimpleCommand,SimpleCommand.prototype.queryState=function(){var selection=new scribe.api.Selection;return scribe.api.Command.prototype.queryState.call(this)&&!!selection.getContaining(function(node){return node.nodeName===this._nodeName}.bind(this))},SimpleCommand}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){!function(global,factory){module.exports=factory()}(this,function(){"use strict";function createClass(ctor,superClass){superClass&&(ctor.prototype=Object.create(superClass.prototype)),ctor.prototype.constructor=ctor}function MakeRef(ref){return ref.value=!1,ref}function SetRef(ref){ref&&(ref.value=!0)}function OwnerID(){}function arrCopy(arr,offset){offset=offset||0;for(var len=Math.max(0,arr.length-offset),newArr=new Array(len),ii=0;len>ii;ii++)newArr[ii]=arr[ii+offset];return newArr}function ensureSize(iter){return void 0===iter.size&&(iter.size=iter.__iterate(returnTrue)),iter.size}function wrapIndex(iter,index){return index>=0?+index:ensureSize(iter)+ +index}function returnTrue(){return!0}function wholeSlice(begin,end,size){return(0===begin||void 0!==size&&-size>=begin)&&(void 0===end||void 0!==size&&end>=size)}function resolveBegin(begin,size){return resolveIndex(begin,size,0)}function resolveEnd(end,size){return resolveIndex(end,size,size)}function resolveIndex(index,size,defaultIndex){return void 0===index?defaultIndex:0>index?Math.max(0,size+index):void 0===size?index:Math.min(size,index)}function Iterable(value){return isIterable(value)?value:Seq(value)}function KeyedIterable(value){return isKeyed(value)?value:KeyedSeq(value)}function IndexedIterable(value){return isIndexed(value)?value:IndexedSeq(value)}function SetIterable(value){return isIterable(value)&&!isAssociative(value)?value:SetSeq(value)}function isIterable(maybeIterable){return!(!maybeIterable||!maybeIterable[IS_ITERABLE_SENTINEL])}function isKeyed(maybeKeyed){return!(!maybeKeyed||!maybeKeyed[IS_KEYED_SENTINEL])}function isIndexed(maybeIndexed){return!(!maybeIndexed||!maybeIndexed[IS_INDEXED_SENTINEL])}function isAssociative(maybeAssociative){return isKeyed(maybeAssociative)||isIndexed(maybeAssociative)}function isOrdered(maybeOrdered){return!(!maybeOrdered||!maybeOrdered[IS_ORDERED_SENTINEL])}function src_Iterator__Iterator(next){this.next=next}function iteratorValue(type,k,v,iteratorResult){var value=0===type?k:1===type?v:[k,v];return iteratorResult?iteratorResult.value=value:iteratorResult={value:value,done:!1},iteratorResult}function iteratorDone(){return{value:void 0,done:!0}}function hasIterator(maybeIterable){return!!getIteratorFn(maybeIterable)}function isIterator(maybeIterator){return maybeIterator&&"function"==typeof maybeIterator.next}function getIterator(iterable){var iteratorFn=getIteratorFn(iterable);return iteratorFn&&iteratorFn.call(iterable)}function getIteratorFn(iterable){var iteratorFn=iterable&&(REAL_ITERATOR_SYMBOL&&iterable[REAL_ITERATOR_SYMBOL]||iterable[FAUX_ITERATOR_SYMBOL]);return"function"==typeof iteratorFn?iteratorFn:void 0}function isArrayLike(value){return value&&"number"==typeof value.length}function Seq(value){return null===value||void 0===value?emptySequence():isIterable(value)?value.toSeq():seqFromValue(value)}function KeyedSeq(value){return null===value||void 0===value?emptySequence().toKeyedSeq():isIterable(value)?isKeyed(value)?value.toSeq():value.fromEntrySeq():keyedSeqFromValue(value)}function IndexedSeq(value){return null===value||void 0===value?emptySequence():isIterable(value)?isKeyed(value)?value.entrySeq():value.toIndexedSeq():indexedSeqFromValue(value)}function SetSeq(value){return(null===value||void 0===value?emptySequence():isIterable(value)?isKeyed(value)?value.entrySeq():value:indexedSeqFromValue(value)).toSetSeq()}function ArraySeq(array){this._array=array,this.size=array.length}function ObjectSeq(object){var keys=Object.keys(object);this._object=object,this._keys=keys,this.size=keys.length}function IterableSeq(iterable){this._iterable=iterable,this.size=iterable.length||iterable.size}function IteratorSeq(iterator){this._iterator=iterator,this._iteratorCache=[]}function isSeq(maybeSeq){return!(!maybeSeq||!maybeSeq[IS_SEQ_SENTINEL])}function emptySequence(){return EMPTY_SEQ||(EMPTY_SEQ=new ArraySeq([]))}function keyedSeqFromValue(value){var seq=Array.isArray(value)?new ArraySeq(value).fromEntrySeq():isIterator(value)?new IteratorSeq(value).fromEntrySeq():hasIterator(value)?new IterableSeq(value).fromEntrySeq():"object"==typeof value?new ObjectSeq(value):void 0;if(!seq)throw new TypeError("Expected Array or iterable object of [k, v] entries, or keyed object: "+value);return seq}function indexedSeqFromValue(value){var seq=maybeIndexedSeqFromValue(value);if(!seq)throw new TypeError("Expected Array or iterable object of values: "+value);return seq}function seqFromValue(value){var seq=maybeIndexedSeqFromValue(value)||"object"==typeof value&&new ObjectSeq(value);if(!seq)throw new TypeError("Expected Array or iterable object of values, or keyed object: "+value);return seq}function maybeIndexedSeqFromValue(value){return isArrayLike(value)?new ArraySeq(value):isIterator(value)?new IteratorSeq(value):hasIterator(value)?new IterableSeq(value):void 0}function seqIterate(seq,fn,reverse,useKeys){var cache=seq._cache;if(cache){for(var maxIndex=cache.length-1,ii=0;maxIndex>=ii;ii++){var entry=cache[reverse?maxIndex-ii:ii];if(fn(entry[1],useKeys?entry[0]:ii,seq)===!1)return ii+1}return ii}return seq.__iterateUncached(fn,reverse)}function seqIterator(seq,type,reverse,useKeys){var cache=seq._cache;if(cache){var maxIndex=cache.length-1,ii=0;return new src_Iterator__Iterator(function(){var entry=cache[reverse?maxIndex-ii:ii];return ii++>maxIndex?iteratorDone():iteratorValue(type,useKeys?entry[0]:ii-1,entry[1])})}return seq.__iteratorUncached(type,reverse)}function Collection(){throw TypeError("Abstract")}function KeyedCollection(){}function IndexedCollection(){}function SetCollection(){}function is(valueA,valueB){return valueA===valueB||valueA!==valueA&&valueB!==valueB?!0:valueA&&valueB?("function"==typeof valueA.valueOf&&"function"==typeof valueB.valueOf&&(valueA=valueA.valueOf(),valueB=valueB.valueOf()),"function"==typeof valueA.equals&&"function"==typeof valueB.equals?valueA.equals(valueB):valueA===valueB||valueA!==valueA&&valueB!==valueB):!1}function fromJS(json,converter){return converter?fromJSWith(converter,json,"",{"":json}):fromJSDefault(json)}function fromJSWith(converter,json,key,parentJSON){return Array.isArray(json)?converter.call(parentJSON,key,IndexedSeq(json).map(function(v,k){return fromJSWith(converter,v,k,json)})):isPlainObj(json)?converter.call(parentJSON,key,KeyedSeq(json).map(function(v,k){return fromJSWith(converter,v,k,json)})):json}function fromJSDefault(json){return Array.isArray(json)?IndexedSeq(json).map(fromJSDefault).toList():isPlainObj(json)?KeyedSeq(json).map(fromJSDefault).toMap():json}function isPlainObj(value){return value&&(value.constructor===Object||void 0===value.constructor)}function smi(i32){return i32>>>1&1073741824|3221225471&i32}function hash(o){if(o===!1||null===o||void 0===o)return 0;if("function"==typeof o.valueOf&&(o=o.valueOf(),o===!1||null===o||void 0===o))return 0;if(o===!0)return 1;var type=typeof o;if("number"===type){
var h=0|o;for(h!==o&&(h^=4294967295*o);o>4294967295;)o/=4294967295,h^=o;return smi(h)}return"string"===type?o.length>STRING_HASH_CACHE_MIN_STRLEN?cachedHashString(o):hashString(o):"function"==typeof o.hashCode?o.hashCode():hashJSObj(o)}function cachedHashString(string){var hash=stringHashCache[string];return void 0===hash&&(hash=hashString(string),STRING_HASH_CACHE_SIZE===STRING_HASH_CACHE_MAX_SIZE&&(STRING_HASH_CACHE_SIZE=0,stringHashCache={}),STRING_HASH_CACHE_SIZE++,stringHashCache[string]=hash),hash}function hashString(string){for(var hash=0,ii=0;ii<string.length;ii++)hash=31*hash+string.charCodeAt(ii)|0;return smi(hash)}function hashJSObj(obj){var hash=weakMap&&weakMap.get(obj);if(hash)return hash;if(hash=obj[UID_HASH_KEY])return hash;if(!canDefineProperty){if(hash=obj.propertyIsEnumerable&&obj.propertyIsEnumerable[UID_HASH_KEY])return hash;if(hash=getIENodeHash(obj))return hash}if(Object.isExtensible&&!Object.isExtensible(obj))throw new Error("Non-extensible objects are not allowed as keys.");if(hash=++objHashUID,1073741824&objHashUID&&(objHashUID=0),weakMap)weakMap.set(obj,hash);else if(canDefineProperty)Object.defineProperty(obj,UID_HASH_KEY,{enumerable:!1,configurable:!1,writable:!1,value:hash});else if(obj.propertyIsEnumerable&&obj.propertyIsEnumerable===obj.constructor.prototype.propertyIsEnumerable)obj.propertyIsEnumerable=function(){return this.constructor.prototype.propertyIsEnumerable.apply(this,arguments)},obj.propertyIsEnumerable[UID_HASH_KEY]=hash;else{if(!obj.nodeType)throw new Error("Unable to set a non-enumerable property on object.");obj[UID_HASH_KEY]=hash}return hash}function getIENodeHash(node){if(node&&node.nodeType>0)switch(node.nodeType){case 1:return node.uniqueID;case 9:return node.documentElement&&node.documentElement.uniqueID}}function invariant(condition,error){if(!condition)throw new Error(error)}function assertNotInfinite(size){invariant(size!==1/0,"Cannot perform this action with an infinite size.")}function ToKeyedSequence(indexed,useKeys){this._iter=indexed,this._useKeys=useKeys,this.size=indexed.size}function ToIndexedSequence(iter){this._iter=iter,this.size=iter.size}function ToSetSequence(iter){this._iter=iter,this.size=iter.size}function FromEntriesSequence(entries){this._iter=entries,this.size=entries.size}function flipFactory(iterable){var flipSequence=makeSequence(iterable);return flipSequence._iter=iterable,flipSequence.size=iterable.size,flipSequence.flip=function(){return iterable},flipSequence.reverse=function(){var reversedSequence=iterable.reverse.apply(this);return reversedSequence.flip=function(){return iterable.reverse()},reversedSequence},flipSequence.has=function(key){return iterable.contains(key)},flipSequence.contains=function(key){return iterable.has(key)},flipSequence.cacheResult=cacheResultThrough,flipSequence.__iterateUncached=function(fn,reverse){var this$0=this;return iterable.__iterate(function(v,k){return fn(k,v,this$0)!==!1},reverse)},flipSequence.__iteratorUncached=function(type,reverse){if(type===ITERATE_ENTRIES){var iterator=iterable.__iterator(type,reverse);return new src_Iterator__Iterator(function(){var step=iterator.next();if(!step.done){var k=step.value[0];step.value[0]=step.value[1],step.value[1]=k}return step})}return iterable.__iterator(type===ITERATE_VALUES?ITERATE_KEYS:ITERATE_VALUES,reverse)},flipSequence}function mapFactory(iterable,mapper,context){var mappedSequence=makeSequence(iterable);return mappedSequence.size=iterable.size,mappedSequence.has=function(key){return iterable.has(key)},mappedSequence.get=function(key,notSetValue){var v=iterable.get(key,NOT_SET);return v===NOT_SET?notSetValue:mapper.call(context,v,key,iterable)},mappedSequence.__iterateUncached=function(fn,reverse){var this$0=this;return iterable.__iterate(function(v,k,c){return fn(mapper.call(context,v,k,c),k,this$0)!==!1},reverse)},mappedSequence.__iteratorUncached=function(type,reverse){var iterator=iterable.__iterator(ITERATE_ENTRIES,reverse);return new src_Iterator__Iterator(function(){var step=iterator.next();if(step.done)return step;var entry=step.value,key=entry[0];return iteratorValue(type,key,mapper.call(context,entry[1],key,iterable),step)})},mappedSequence}function reverseFactory(iterable,useKeys){var reversedSequence=makeSequence(iterable);return reversedSequence._iter=iterable,reversedSequence.size=iterable.size,reversedSequence.reverse=function(){return iterable},iterable.flip&&(reversedSequence.flip=function(){var flipSequence=flipFactory(iterable);return flipSequence.reverse=function(){return iterable.flip()},flipSequence}),reversedSequence.get=function(key,notSetValue){return iterable.get(useKeys?key:-1-key,notSetValue)},reversedSequence.has=function(key){return iterable.has(useKeys?key:-1-key)},reversedSequence.contains=function(value){return iterable.contains(value)},reversedSequence.cacheResult=cacheResultThrough,reversedSequence.__iterate=function(fn,reverse){var this$0=this;return iterable.__iterate(function(v,k){return fn(v,k,this$0)},!reverse)},reversedSequence.__iterator=function(type,reverse){return iterable.__iterator(type,!reverse)},reversedSequence}function filterFactory(iterable,predicate,context,useKeys){var filterSequence=makeSequence(iterable);return useKeys&&(filterSequence.has=function(key){var v=iterable.get(key,NOT_SET);return v!==NOT_SET&&!!predicate.call(context,v,key,iterable)},filterSequence.get=function(key,notSetValue){var v=iterable.get(key,NOT_SET);return v!==NOT_SET&&predicate.call(context,v,key,iterable)?v:notSetValue}),filterSequence.__iterateUncached=function(fn,reverse){var this$0=this,iterations=0;return iterable.__iterate(function(v,k,c){return predicate.call(context,v,k,c)?(iterations++,fn(v,useKeys?k:iterations-1,this$0)):void 0},reverse),iterations},filterSequence.__iteratorUncached=function(type,reverse){var iterator=iterable.__iterator(ITERATE_ENTRIES,reverse),iterations=0;return new src_Iterator__Iterator(function(){for(;;){var step=iterator.next();if(step.done)return step;var entry=step.value,key=entry[0],value=entry[1];if(predicate.call(context,value,key,iterable))return iteratorValue(type,useKeys?key:iterations++,value,step)}})},filterSequence}function countByFactory(iterable,grouper,context){var groups=src_Map__Map().asMutable();return iterable.__iterate(function(v,k){groups.update(grouper.call(context,v,k,iterable),0,function(a){return a+1})}),groups.asImmutable()}function groupByFactory(iterable,grouper,context){var isKeyedIter=isKeyed(iterable),groups=(isOrdered(iterable)?OrderedMap():src_Map__Map()).asMutable();iterable.__iterate(function(v,k){groups.update(grouper.call(context,v,k,iterable),function(a){return a=a||[],a.push(isKeyedIter?[k,v]:v),a})});var coerce=iterableClass(iterable);return groups.map(function(arr){return reify(iterable,coerce(arr))})}function sliceFactory(iterable,begin,end,useKeys){var originalSize=iterable.size;if(wholeSlice(begin,end,originalSize))return iterable;var resolvedBegin=resolveBegin(begin,originalSize),resolvedEnd=resolveEnd(end,originalSize);if(resolvedBegin!==resolvedBegin||resolvedEnd!==resolvedEnd)return sliceFactory(iterable.toSeq().cacheResult(),begin,end,useKeys);var sliceSize=resolvedEnd-resolvedBegin;0>sliceSize&&(sliceSize=0);var sliceSeq=makeSequence(iterable);return sliceSeq.size=0===sliceSize?sliceSize:iterable.size&&sliceSize||void 0,!useKeys&&isSeq(iterable)&&sliceSize>=0&&(sliceSeq.get=function(index,notSetValue){return index=wrapIndex(this,index),index>=0&&sliceSize>index?iterable.get(index+resolvedBegin,notSetValue):notSetValue}),sliceSeq.__iterateUncached=function(fn,reverse){var this$0=this;if(0===sliceSize)return 0;if(reverse)return this.cacheResult().__iterate(fn,reverse);var skipped=0,isSkipping=!0,iterations=0;return iterable.__iterate(function(v,k){return isSkipping&&(isSkipping=skipped++<resolvedBegin)?void 0:(iterations++,fn(v,useKeys?k:iterations-1,this$0)!==!1&&iterations!==sliceSize)}),iterations},sliceSeq.__iteratorUncached=function(type,reverse){if(sliceSize&&reverse)return this.cacheResult().__iterator(type,reverse);var iterator=sliceSize&&iterable.__iterator(type,reverse),skipped=0,iterations=0;return new src_Iterator__Iterator(function(){for(;skipped++!==resolvedBegin;)iterator.next();if(++iterations>sliceSize)return iteratorDone();var step=iterator.next();return useKeys||type===ITERATE_VALUES?step:type===ITERATE_KEYS?iteratorValue(type,iterations-1,void 0,step):iteratorValue(type,iterations-1,step.value[1],step)})},sliceSeq}function takeWhileFactory(iterable,predicate,context){var takeSequence=makeSequence(iterable);return takeSequence.__iterateUncached=function(fn,reverse){var this$0=this;if(reverse)return this.cacheResult().__iterate(fn,reverse);var iterations=0;return iterable.__iterate(function(v,k,c){return predicate.call(context,v,k,c)&&++iterations&&fn(v,k,this$0)}),iterations},takeSequence.__iteratorUncached=function(type,reverse){var this$0=this;if(reverse)return this.cacheResult().__iterator(type,reverse);var iterator=iterable.__iterator(ITERATE_ENTRIES,reverse),iterating=!0;return new src_Iterator__Iterator(function(){if(!iterating)return iteratorDone();var step=iterator.next();if(step.done)return step;var entry=step.value,k=entry[0],v=entry[1];return predicate.call(context,v,k,this$0)?type===ITERATE_ENTRIES?step:iteratorValue(type,k,v,step):(iterating=!1,iteratorDone())})},takeSequence}function skipWhileFactory(iterable,predicate,context,useKeys){var skipSequence=makeSequence(iterable);return skipSequence.__iterateUncached=function(fn,reverse){var this$0=this;if(reverse)return this.cacheResult().__iterate(fn,reverse);var isSkipping=!0,iterations=0;return iterable.__iterate(function(v,k,c){return isSkipping&&(isSkipping=predicate.call(context,v,k,c))?void 0:(iterations++,fn(v,useKeys?k:iterations-1,this$0))}),iterations},skipSequence.__iteratorUncached=function(type,reverse){var this$0=this;if(reverse)return this.cacheResult().__iterator(type,reverse);var iterator=iterable.__iterator(ITERATE_ENTRIES,reverse),skipping=!0,iterations=0;return new src_Iterator__Iterator(function(){var step,k,v;do{if(step=iterator.next(),step.done)return useKeys||type===ITERATE_VALUES?step:type===ITERATE_KEYS?iteratorValue(type,iterations++,void 0,step):iteratorValue(type,iterations++,step.value[1],step);var entry=step.value;k=entry[0],v=entry[1],skipping&&(skipping=predicate.call(context,v,k,this$0))}while(skipping);return type===ITERATE_ENTRIES?step:iteratorValue(type,k,v,step)})},skipSequence}function concatFactory(iterable,values){var isKeyedIterable=isKeyed(iterable),iters=[iterable].concat(values).map(function(v){return isIterable(v)?isKeyedIterable&&(v=KeyedIterable(v)):v=isKeyedIterable?keyedSeqFromValue(v):indexedSeqFromValue(Array.isArray(v)?v:[v]),v}).filter(function(v){return 0!==v.size});if(0===iters.length)return iterable;if(1===iters.length){var singleton=iters[0];if(singleton===iterable||isKeyedIterable&&isKeyed(singleton)||isIndexed(iterable)&&isIndexed(singleton))return singleton}var concatSeq=new ArraySeq(iters);return isKeyedIterable?concatSeq=concatSeq.toKeyedSeq():isIndexed(iterable)||(concatSeq=concatSeq.toSetSeq()),concatSeq=concatSeq.flatten(!0),concatSeq.size=iters.reduce(function(sum,seq){if(void 0!==sum){var size=seq.size;if(void 0!==size)return sum+size}},0),concatSeq}function flattenFactory(iterable,depth,useKeys){var flatSequence=makeSequence(iterable);return flatSequence.__iterateUncached=function(fn,reverse){function flatDeep(iter,currentDepth){var this$0=this;iter.__iterate(function(v,k){return(!depth||depth>currentDepth)&&isIterable(v)?flatDeep(v,currentDepth+1):fn(v,useKeys?k:iterations++,this$0)===!1&&(stopped=!0),!stopped},reverse)}var iterations=0,stopped=!1;return flatDeep(iterable,0),iterations},flatSequence.__iteratorUncached=function(type,reverse){var iterator=iterable.__iterator(type,reverse),stack=[],iterations=0;return new src_Iterator__Iterator(function(){for(;iterator;){var step=iterator.next();if(step.done===!1){var v=step.value;if(type===ITERATE_ENTRIES&&(v=v[1]),depth&&!(stack.length<depth)||!isIterable(v))return useKeys?step:iteratorValue(type,iterations++,v,step);stack.push(iterator),iterator=v.__iterator(type,reverse)}else iterator=stack.pop()}return iteratorDone()})},flatSequence}function flatMapFactory(iterable,mapper,context){var coerce=iterableClass(iterable);return iterable.toSeq().map(function(v,k){return coerce(mapper.call(context,v,k,iterable))}).flatten(!0)}function interposeFactory(iterable,separator){var interposedSequence=makeSequence(iterable);return interposedSequence.size=iterable.size&&2*iterable.size-1,interposedSequence.__iterateUncached=function(fn,reverse){var this$0=this,iterations=0;return iterable.__iterate(function(v,k){return(!iterations||fn(separator,iterations++,this$0)!==!1)&&fn(v,iterations++,this$0)!==!1},reverse),iterations},interposedSequence.__iteratorUncached=function(type,reverse){var step,iterator=iterable.__iterator(ITERATE_VALUES,reverse),iterations=0;return new src_Iterator__Iterator(function(){return(!step||iterations%2)&&(step=iterator.next(),step.done)?step:iterations%2?iteratorValue(type,iterations++,separator):iteratorValue(type,iterations++,step.value,step)})},interposedSequence}function sortFactory(iterable,comparator,mapper){comparator||(comparator=defaultComparator);var isKeyedIterable=isKeyed(iterable),index=0,entries=iterable.toSeq().map(function(v,k){return[k,v,index++,mapper?mapper(v,k,iterable):v]}).toArray();return entries.sort(function(a,b){return comparator(a[3],b[3])||a[2]-b[2]}).forEach(isKeyedIterable?function(v,i){entries[i].length=2}:function(v,i){entries[i]=v[1]}),isKeyedIterable?KeyedSeq(entries):isIndexed(iterable)?IndexedSeq(entries):SetSeq(entries)}function maxFactory(iterable,comparator,mapper){if(comparator||(comparator=defaultComparator),mapper){var entry=iterable.toSeq().map(function(v,k){return[v,mapper(v,k,iterable)]}).reduce(function(a,b){return maxCompare(comparator,a[1],b[1])?b:a});return entry&&entry[0]}return iterable.reduce(function(a,b){return maxCompare(comparator,a,b)?b:a})}function maxCompare(comparator,a,b){var comp=comparator(b,a);return 0===comp&&b!==a&&(void 0===b||null===b||b!==b)||comp>0}function zipWithFactory(keyIter,zipper,iters){var zipSequence=makeSequence(keyIter);return zipSequence.size=new ArraySeq(iters).map(function(i){return i.size}).min(),zipSequence.__iterate=function(fn,reverse){for(var step,iterator=this.__iterator(ITERATE_VALUES,reverse),iterations=0;!(step=iterator.next()).done&&fn(step.value,iterations++,this)!==!1;);return iterations},zipSequence.__iteratorUncached=function(type,reverse){var iterators=iters.map(function(i){return i=Iterable(i),getIterator(reverse?i.reverse():i)}),iterations=0,isDone=!1;return new src_Iterator__Iterator(function(){var steps;return isDone||(steps=iterators.map(function(i){return i.next()}),isDone=steps.some(function(s){return s.done})),isDone?iteratorDone():iteratorValue(type,iterations++,zipper.apply(null,steps.map(function(s){return s.value})))})},zipSequence}function reify(iter,seq){return isSeq(iter)?seq:iter.constructor(seq)}function validateEntry(entry){if(entry!==Object(entry))throw new TypeError("Expected [K, V] tuple: "+entry)}function resolveSize(iter){return assertNotInfinite(iter.size),ensureSize(iter)}function iterableClass(iterable){return isKeyed(iterable)?KeyedIterable:isIndexed(iterable)?IndexedIterable:SetIterable}function makeSequence(iterable){return Object.create((isKeyed(iterable)?KeyedSeq:isIndexed(iterable)?IndexedSeq:SetSeq).prototype)}function cacheResultThrough(){return this._iter.cacheResult?(this._iter.cacheResult(),this.size=this._iter.size,this):Seq.prototype.cacheResult.call(this)}function defaultComparator(a,b){return a>b?1:b>a?-1:0}function forceIterator(keyPath){var iter=getIterator(keyPath);if(!iter){if(!isArrayLike(keyPath))throw new TypeError("Expected iterable or array-like: "+keyPath);iter=getIterator(Iterable(keyPath))}return iter}function src_Map__Map(value){return null===value||void 0===value?emptyMap():isMap(value)?value:emptyMap().withMutations(function(map){var iter=KeyedIterable(value);assertNotInfinite(iter.size),iter.forEach(function(v,k){return map.set(k,v)})})}function isMap(maybeMap){return!(!maybeMap||!maybeMap[IS_MAP_SENTINEL])}function ArrayMapNode(ownerID,entries){this.ownerID=ownerID,this.entries=entries}function BitmapIndexedNode(ownerID,bitmap,nodes){this.ownerID=ownerID,this.bitmap=bitmap,this.nodes=nodes}function HashArrayMapNode(ownerID,count,nodes){this.ownerID=ownerID,this.count=count,this.nodes=nodes}function HashCollisionNode(ownerID,keyHash,entries){this.ownerID=ownerID,this.keyHash=keyHash,this.entries=entries}function ValueNode(ownerID,keyHash,entry){this.ownerID=ownerID,this.keyHash=keyHash,this.entry=entry}function MapIterator(map,type,reverse){this._type=type,this._reverse=reverse,this._stack=map._root&&mapIteratorFrame(map._root)}function mapIteratorValue(type,entry){return iteratorValue(type,entry[0],entry[1])}function mapIteratorFrame(node,prev){return{node:node,index:0,__prev:prev}}function makeMap(size,root,ownerID,hash){var map=Object.create(MapPrototype);return map.size=size,map._root=root,map.__ownerID=ownerID,map.__hash=hash,map.__altered=!1,map}function emptyMap(){return EMPTY_MAP||(EMPTY_MAP=makeMap(0))}function updateMap(map,k,v){var newRoot,newSize;if(map._root){var didChangeSize=MakeRef(CHANGE_LENGTH),didAlter=MakeRef(DID_ALTER);if(newRoot=updateNode(map._root,map.__ownerID,0,void 0,k,v,didChangeSize,didAlter),!didAlter.value)return map;newSize=map.size+(didChangeSize.value?v===NOT_SET?-1:1:0)}else{if(v===NOT_SET)return map;newSize=1,newRoot=new ArrayMapNode(map.__ownerID,[[k,v]])}return map.__ownerID?(map.size=newSize,map._root=newRoot,map.__hash=void 0,map.__altered=!0,map):newRoot?makeMap(newSize,newRoot):emptyMap()}function updateNode(node,ownerID,shift,keyHash,key,value,didChangeSize,didAlter){return node?node.update(ownerID,shift,keyHash,key,value,didChangeSize,didAlter):value===NOT_SET?node:(SetRef(didAlter),SetRef(didChangeSize),new ValueNode(ownerID,keyHash,[key,value]))}function isLeafNode(node){return node.constructor===ValueNode||node.constructor===HashCollisionNode}function mergeIntoNode(node,ownerID,shift,keyHash,entry){if(node.keyHash===keyHash)return new HashCollisionNode(ownerID,keyHash,[node.entry,entry]);var newNode,idx1=(0===shift?node.keyHash:node.keyHash>>>shift)&MASK,idx2=(0===shift?keyHash:keyHash>>>shift)&MASK,nodes=idx1===idx2?[mergeIntoNode(node,ownerID,shift+SHIFT,keyHash,entry)]:(newNode=new ValueNode(ownerID,keyHash,entry),idx2>idx1?[node,newNode]:[newNode,node]);return new BitmapIndexedNode(ownerID,1<<idx1|1<<idx2,nodes)}function createNodes(ownerID,entries,key,value){ownerID||(ownerID=new OwnerID);for(var node=new ValueNode(ownerID,hash(key),[key,value]),ii=0;ii<entries.length;ii++){var entry=entries[ii];node=node.update(ownerID,0,void 0,entry[0],entry[1])}return node}function packNodes(ownerID,nodes,count,excluding){for(var bitmap=0,packedII=0,packedNodes=new Array(count),ii=0,bit=1,len=nodes.length;len>ii;ii++,bit<<=1){var node=nodes[ii];void 0!==node&&ii!==excluding&&(bitmap|=bit,packedNodes[packedII++]=node)}return new BitmapIndexedNode(ownerID,bitmap,packedNodes)}function expandNodes(ownerID,nodes,bitmap,including,node){for(var count=0,expandedNodes=new Array(SIZE),ii=0;0!==bitmap;ii++,bitmap>>>=1)expandedNodes[ii]=1&bitmap?nodes[count++]:void 0;return expandedNodes[including]=node,new HashArrayMapNode(ownerID,count+1,expandedNodes)}function mergeIntoMapWith(map,merger,iterables){for(var iters=[],ii=0;ii<iterables.length;ii++){var value=iterables[ii],iter=KeyedIterable(value);isIterable(value)||(iter=iter.map(function(v){return fromJS(v)})),iters.push(iter)}return mergeIntoCollectionWith(map,merger,iters)}function deepMerger(merger){return function(existing,value){return existing&&existing.mergeDeepWith&&isIterable(value)?existing.mergeDeepWith(merger,value):merger?merger(existing,value):value}}function mergeIntoCollectionWith(collection,merger,iters){return iters=iters.filter(function(x){return 0!==x.size}),0===iters.length?collection:0===collection.size&&1===iters.length?collection.constructor(iters[0]):collection.withMutations(function(collection){for(var mergeIntoMap=merger?function(value,key){collection.update(key,NOT_SET,function(existing){return existing===NOT_SET?value:merger(existing,value)})}:function(value,key){collection.set(key,value)},ii=0;ii<iters.length;ii++)iters[ii].forEach(mergeIntoMap)})}function updateInDeepMap(existing,keyPathIter,notSetValue,updater){var isNotSet=existing===NOT_SET,step=keyPathIter.next();if(step.done){var existingValue=isNotSet?notSetValue:existing,newValue=updater(existingValue);return newValue===existingValue?existing:newValue}invariant(isNotSet||existing&&existing.set,"invalid keyPath");var key=step.value,nextExisting=isNotSet?NOT_SET:existing.get(key,NOT_SET),nextUpdated=updateInDeepMap(nextExisting,keyPathIter,notSetValue,updater);return nextUpdated===nextExisting?existing:nextUpdated===NOT_SET?existing.remove(key):(isNotSet?emptyMap():existing).set(key,nextUpdated)}function popCount(x){return x-=x>>1&1431655765,x=(858993459&x)+(x>>2&858993459),x=x+(x>>4)&252645135,x+=x>>8,x+=x>>16,127&x}function setIn(array,idx,val,canEdit){var newArray=canEdit?array:arrCopy(array);return newArray[idx]=val,newArray}function spliceIn(array,idx,val,canEdit){var newLen=array.length+1;if(canEdit&&idx+1===newLen)return array[idx]=val,array;for(var newArray=new Array(newLen),after=0,ii=0;newLen>ii;ii++)ii===idx?(newArray[ii]=val,after=-1):newArray[ii]=array[ii+after];return newArray}function spliceOut(array,idx,canEdit){var newLen=array.length-1;if(canEdit&&idx===newLen)return array.pop(),array;for(var newArray=new Array(newLen),after=0,ii=0;newLen>ii;ii++)ii===idx&&(after=1),newArray[ii]=array[ii+after];return newArray}function List(value){var empty=emptyList();if(null===value||void 0===value)return empty;if(isList(value))return value;var iter=IndexedIterable(value),size=iter.size;return 0===size?empty:(assertNotInfinite(size),size>0&&SIZE>size?makeList(0,size,SHIFT,null,new VNode(iter.toArray())):empty.withMutations(function(list){list.setSize(size),iter.forEach(function(v,i){return list.set(i,v)})}))}function isList(maybeList){return!(!maybeList||!maybeList[IS_LIST_SENTINEL])}function VNode(array,ownerID){this.array=array,this.ownerID=ownerID}function iterateList(list,reverse){function iterateNodeOrLeaf(node,level,offset){return 0===level?iterateLeaf(node,offset):iterateNode(node,level,offset)}function iterateLeaf(node,offset){var array=offset===tailPos?tail&&tail.array:node&&node.array,from=offset>left?0:left-offset,to=right-offset;return to>SIZE&&(to=SIZE),function(){if(from===to)return DONE;var idx=reverse?--to:from++;return array&&array[idx]}}function iterateNode(node,level,offset){var values,array=node&&node.array,from=offset>left?0:left-offset>>level,to=(right-offset>>level)+1;return to>SIZE&&(to=SIZE),function(){for(;;){if(values){var value=values();if(value!==DONE)return value;values=null}if(from===to)return DONE;var idx=reverse?--to:from++;values=iterateNodeOrLeaf(array&&array[idx],level-SHIFT,offset+(idx<<level))}}}var left=list._origin,right=list._capacity,tailPos=getTailOffset(right),tail=list._tail;return iterateNodeOrLeaf(list._root,list._level,0)}function makeList(origin,capacity,level,root,tail,ownerID,hash){var list=Object.create(ListPrototype);return list.size=capacity-origin,list._origin=origin,list._capacity=capacity,list._level=level,list._root=root,list._tail=tail,list.__ownerID=ownerID,list.__hash=hash,list.__altered=!1,list}function emptyList(){return EMPTY_LIST||(EMPTY_LIST=makeList(0,0,SHIFT))}function updateList(list,index,value){if(index=wrapIndex(list,index),index>=list.size||0>index)return list.withMutations(function(list){0>index?setListBounds(list,index).set(0,value):setListBounds(list,0,index+1).set(index,value)});index+=list._origin;var newTail=list._tail,newRoot=list._root,didAlter=MakeRef(DID_ALTER);return index>=getTailOffset(list._capacity)?newTail=updateVNode(newTail,list.__ownerID,0,index,value,didAlter):newRoot=updateVNode(newRoot,list.__ownerID,list._level,index,value,didAlter),didAlter.value?list.__ownerID?(list._root=newRoot,list._tail=newTail,list.__hash=void 0,list.__altered=!0,list):makeList(list._origin,list._capacity,list._level,newRoot,newTail):list}function updateVNode(node,ownerID,level,index,value,didAlter){var idx=index>>>level&MASK,nodeHas=node&&idx<node.array.length;if(!nodeHas&&void 0===value)return node;var newNode;if(level>0){var lowerNode=node&&node.array[idx],newLowerNode=updateVNode(lowerNode,ownerID,level-SHIFT,index,value,didAlter);return newLowerNode===lowerNode?node:(newNode=editableVNode(node,ownerID),newNode.array[idx]=newLowerNode,newNode)}return nodeHas&&node.array[idx]===value?node:(SetRef(didAlter),newNode=editableVNode(node,ownerID),void 0===value&&idx===newNode.array.length-1?newNode.array.pop():newNode.array[idx]=value,newNode)}function editableVNode(node,ownerID){return ownerID&&node&&ownerID===node.ownerID?node:new VNode(node?node.array.slice():[],ownerID)}function listNodeFor(list,rawIndex){if(rawIndex>=getTailOffset(list._capacity))return list._tail;if(rawIndex<1<<list._level+SHIFT){for(var node=list._root,level=list._level;node&&level>0;)node=node.array[rawIndex>>>level&MASK],level-=SHIFT;return node}}function setListBounds(list,begin,end){var owner=list.__ownerID||new OwnerID,oldOrigin=list._origin,oldCapacity=list._capacity,newOrigin=oldOrigin+begin,newCapacity=void 0===end?oldCapacity:0>end?oldCapacity+end:oldOrigin+end;if(newOrigin===oldOrigin&&newCapacity===oldCapacity)return list;if(newOrigin>=newCapacity)return list.clear();for(var newLevel=list._level,newRoot=list._root,offsetShift=0;0>newOrigin+offsetShift;)newRoot=new VNode(newRoot&&newRoot.array.length?[void 0,newRoot]:[],owner),newLevel+=SHIFT,offsetShift+=1<<newLevel;offsetShift&&(newOrigin+=offsetShift,oldOrigin+=offsetShift,newCapacity+=offsetShift,oldCapacity+=offsetShift);for(var oldTailOffset=getTailOffset(oldCapacity),newTailOffset=getTailOffset(newCapacity);newTailOffset>=1<<newLevel+SHIFT;)newRoot=new VNode(newRoot&&newRoot.array.length?[newRoot]:[],owner),newLevel+=SHIFT;var oldTail=list._tail,newTail=oldTailOffset>newTailOffset?listNodeFor(list,newCapacity-1):newTailOffset>oldTailOffset?new VNode([],owner):oldTail;if(oldTail&&newTailOffset>oldTailOffset&&oldCapacity>newOrigin&&oldTail.array.length){newRoot=editableVNode(newRoot,owner);for(var node=newRoot,level=newLevel;level>SHIFT;level-=SHIFT){var idx=oldTailOffset>>>level&MASK;node=node.array[idx]=editableVNode(node.array[idx],owner)}node.array[oldTailOffset>>>SHIFT&MASK]=oldTail}if(oldCapacity>newCapacity&&(newTail=newTail&&newTail.removeAfter(owner,0,newCapacity)),newOrigin>=newTailOffset)newOrigin-=newTailOffset,newCapacity-=newTailOffset,newLevel=SHIFT,newRoot=null,newTail=newTail&&newTail.removeBefore(owner,0,newOrigin);else if(newOrigin>oldOrigin||oldTailOffset>newTailOffset){for(offsetShift=0;newRoot;){var beginIndex=newOrigin>>>newLevel&MASK;if(beginIndex!==newTailOffset>>>newLevel&MASK)break;beginIndex&&(offsetShift+=(1<<newLevel)*beginIndex),newLevel-=SHIFT,newRoot=newRoot.array[beginIndex]}newRoot&&newOrigin>oldOrigin&&(newRoot=newRoot.removeBefore(owner,newLevel,newOrigin-offsetShift)),newRoot&&oldTailOffset>newTailOffset&&(newRoot=newRoot.removeAfter(owner,newLevel,newTailOffset-offsetShift)),offsetShift&&(newOrigin-=offsetShift,newCapacity-=offsetShift)}return list.__ownerID?(list.size=newCapacity-newOrigin,list._origin=newOrigin,list._capacity=newCapacity,list._level=newLevel,list._root=newRoot,list._tail=newTail,list.__hash=void 0,list.__altered=!0,list):makeList(newOrigin,newCapacity,newLevel,newRoot,newTail)}function mergeIntoListWith(list,merger,iterables){for(var iters=[],maxSize=0,ii=0;ii<iterables.length;ii++){var value=iterables[ii],iter=IndexedIterable(value);iter.size>maxSize&&(maxSize=iter.size),isIterable(value)||(iter=iter.map(function(v){return fromJS(v)})),iters.push(iter)}return maxSize>list.size&&(list=list.setSize(maxSize)),mergeIntoCollectionWith(list,merger,iters)}function getTailOffset(size){return SIZE>size?0:size-1>>>SHIFT<<SHIFT}function OrderedMap(value){return null===value||void 0===value?emptyOrderedMap():isOrderedMap(value)?value:emptyOrderedMap().withMutations(function(map){var iter=KeyedIterable(value);assertNotInfinite(iter.size),iter.forEach(function(v,k){return map.set(k,v)})})}function isOrderedMap(maybeOrderedMap){return isMap(maybeOrderedMap)&&isOrdered(maybeOrderedMap)}function makeOrderedMap(map,list,ownerID,hash){var omap=Object.create(OrderedMap.prototype);return omap.size=map?map.size:0,omap._map=map,omap._list=list,omap.__ownerID=ownerID,omap.__hash=hash,omap}function emptyOrderedMap(){return EMPTY_ORDERED_MAP||(EMPTY_ORDERED_MAP=makeOrderedMap(emptyMap(),emptyList()))}function updateOrderedMap(omap,k,v){var newMap,newList,map=omap._map,list=omap._list,i=map.get(k),has=void 0!==i;if(v===NOT_SET){if(!has)return omap;list.size>=SIZE&&list.size>=2*map.size?(newList=list.filter(function(entry,idx){return void 0!==entry&&i!==idx}),newMap=newList.toKeyedSeq().map(function(entry){return entry[0]}).flip().toMap(),omap.__ownerID&&(newMap.__ownerID=newList.__ownerID=omap.__ownerID)):(newMap=map.remove(k),newList=i===list.size-1?list.pop():list.set(i,void 0))}else if(has){if(v===list.get(i)[1])return omap;newMap=map,newList=list.set(i,[k,v])}else newMap=map.set(k,list.size),newList=list.set(list.size,[k,v]);return omap.__ownerID?(omap.size=newMap.size,omap._map=newMap,omap._list=newList,omap.__hash=void 0,omap):makeOrderedMap(newMap,newList)}function Stack(value){return null===value||void 0===value?emptyStack():isStack(value)?value:emptyStack().unshiftAll(value)}function isStack(maybeStack){return!(!maybeStack||!maybeStack[IS_STACK_SENTINEL])}function makeStack(size,head,ownerID,hash){var map=Object.create(StackPrototype);return map.size=size,map._head=head,map.__ownerID=ownerID,map.__hash=hash,map.__altered=!1,map}function emptyStack(){return EMPTY_STACK||(EMPTY_STACK=makeStack(0))}function src_Set__Set(value){return null===value||void 0===value?emptySet():isSet(value)?value:emptySet().withMutations(function(set){var iter=SetIterable(value);assertNotInfinite(iter.size),iter.forEach(function(v){return set.add(v)})})}function isSet(maybeSet){return!(!maybeSet||!maybeSet[IS_SET_SENTINEL])}function updateSet(set,newMap){return set.__ownerID?(set.size=newMap.size,set._map=newMap,set):newMap===set._map?set:0===newMap.size?set.__empty():set.__make(newMap)}function makeSet(map,ownerID){var set=Object.create(SetPrototype);return set.size=map?map.size:0,set._map=map,set.__ownerID=ownerID,set}function emptySet(){return EMPTY_SET||(EMPTY_SET=makeSet(emptyMap()))}function OrderedSet(value){return null===value||void 0===value?emptyOrderedSet():isOrderedSet(value)?value:emptyOrderedSet().withMutations(function(set){var iter=SetIterable(value);assertNotInfinite(iter.size),iter.forEach(function(v){return set.add(v)})})}function isOrderedSet(maybeOrderedSet){return isSet(maybeOrderedSet)&&isOrdered(maybeOrderedSet)}function makeOrderedSet(map,ownerID){var set=Object.create(OrderedSetPrototype);return set.size=map?map.size:0,set._map=map,set.__ownerID=ownerID,set}function emptyOrderedSet(){return EMPTY_ORDERED_SET||(EMPTY_ORDERED_SET=makeOrderedSet(emptyOrderedMap()))}function Record(defaultValues,name){var RecordType=function(values){return this instanceof RecordType?void(this._map=src_Map__Map(values)):new RecordType(values)},keys=Object.keys(defaultValues),RecordTypePrototype=RecordType.prototype=Object.create(RecordPrototype);RecordTypePrototype.constructor=RecordType,name&&(RecordTypePrototype._name=name),RecordTypePrototype._defaultValues=defaultValues,RecordTypePrototype._keys=keys,RecordTypePrototype.size=keys.length;try{keys.forEach(function(key){Object.defineProperty(RecordType.prototype,key,{get:function(){return this.get(key)},set:function(value){
invariant(this.__ownerID,"Cannot set on an immutable record."),this.set(key,value)}})})}catch(error){}return RecordType}function makeRecord(likeRecord,map,ownerID){var record=Object.create(Object.getPrototypeOf(likeRecord));return record._map=map,record.__ownerID=ownerID,record}function recordName(record){return record._name||record.constructor.name}function deepEqual(a,b){if(a===b)return!0;if(!isIterable(b)||void 0!==a.size&&void 0!==b.size&&a.size!==b.size||void 0!==a.__hash&&void 0!==b.__hash&&a.__hash!==b.__hash||isKeyed(a)!==isKeyed(b)||isIndexed(a)!==isIndexed(b)||isOrdered(a)!==isOrdered(b))return!1;if(0===a.size&&0===b.size)return!0;var notAssociative=!isAssociative(a);if(isOrdered(a)){var entries=a.entries();return b.every(function(v,k){var entry=entries.next().value;return entry&&is(entry[1],v)&&(notAssociative||is(entry[0],k))})&&entries.next().done}var flipped=!1;if(void 0===a.size)if(void 0===b.size)a.cacheResult();else{flipped=!0;var _=a;a=b,b=_}var allEqual=!0,bSize=b.__iterate(function(v,k){return(notAssociative?a.has(v):flipped?is(v,a.get(k,NOT_SET)):is(a.get(k,NOT_SET),v))?void 0:(allEqual=!1,!1)});return allEqual&&a.size===bSize}function Range(start,end,step){if(!(this instanceof Range))return new Range(start,end,step);if(invariant(0!==step,"Cannot step a Range by 0"),start=start||0,void 0===end&&(end=1/0),step=void 0===step?1:Math.abs(step),start>end&&(step=-step),this._start=start,this._end=end,this._step=step,this.size=Math.max(0,Math.ceil((end-start)/step-1)+1),0===this.size){if(EMPTY_RANGE)return EMPTY_RANGE;EMPTY_RANGE=this}}function Repeat(value,times){if(!(this instanceof Repeat))return new Repeat(value,times);if(this._value=value,this.size=void 0===times?1/0:Math.max(0,times),0===this.size){if(EMPTY_REPEAT)return EMPTY_REPEAT;EMPTY_REPEAT=this}}function mixin(ctor,methods){var keyCopier=function(key){ctor.prototype[key]=methods[key]};return Object.keys(methods).forEach(keyCopier),Object.getOwnPropertySymbols&&Object.getOwnPropertySymbols(methods).forEach(keyCopier),ctor}function keyMapper(v,k){return k}function entryMapper(v,k){return[k,v]}function not(predicate){return function(){return!predicate.apply(this,arguments)}}function neg(predicate){return function(){return-predicate.apply(this,arguments)}}function quoteString(value){return"string"==typeof value?JSON.stringify(value):value}function defaultZipper(){return arrCopy(arguments)}function defaultNegComparator(a,b){return b>a?1:a>b?-1:0}function hashIterable(iterable){if(iterable.size===1/0)return 0;var ordered=isOrdered(iterable),keyed=isKeyed(iterable),h=ordered?1:0,size=iterable.__iterate(keyed?ordered?function(v,k){h=31*h+hashMerge(hash(v),hash(k))|0}:function(v,k){h=h+hashMerge(hash(v),hash(k))|0}:ordered?function(v){h=31*h+hash(v)|0}:function(v){h=h+hash(v)|0});return murmurHashOfSize(size,h)}function murmurHashOfSize(size,h){return h=src_Math__imul(h,3432918353),h=src_Math__imul(h<<15|h>>>-15,461845907),h=src_Math__imul(h<<13|h>>>-13,5),h=(h+3864292196|0)^size,h=src_Math__imul(h^h>>>16,2246822507),h=src_Math__imul(h^h>>>13,3266489909),h=smi(h^h>>>16)}function hashMerge(a,b){return a^b+2654435769+(a<<6)+(a>>2)|0}var SLICE$0=Array.prototype.slice,DELETE="delete",SHIFT=5,SIZE=1<<SHIFT,MASK=SIZE-1,NOT_SET={},CHANGE_LENGTH={value:!1},DID_ALTER={value:!1};createClass(KeyedIterable,Iterable),createClass(IndexedIterable,Iterable),createClass(SetIterable,Iterable),Iterable.isIterable=isIterable,Iterable.isKeyed=isKeyed,Iterable.isIndexed=isIndexed,Iterable.isAssociative=isAssociative,Iterable.isOrdered=isOrdered,Iterable.Keyed=KeyedIterable,Iterable.Indexed=IndexedIterable,Iterable.Set=SetIterable;var IS_ITERABLE_SENTINEL="@@__IMMUTABLE_ITERABLE__@@",IS_KEYED_SENTINEL="@@__IMMUTABLE_KEYED__@@",IS_INDEXED_SENTINEL="@@__IMMUTABLE_INDEXED__@@",IS_ORDERED_SENTINEL="@@__IMMUTABLE_ORDERED__@@",ITERATE_KEYS=0,ITERATE_VALUES=1,ITERATE_ENTRIES=2,REAL_ITERATOR_SYMBOL="function"==typeof Symbol&&Symbol.iterator,FAUX_ITERATOR_SYMBOL="@@iterator",ITERATOR_SYMBOL=REAL_ITERATOR_SYMBOL||FAUX_ITERATOR_SYMBOL;src_Iterator__Iterator.prototype.toString=function(){return"[Iterator]"},src_Iterator__Iterator.KEYS=ITERATE_KEYS,src_Iterator__Iterator.VALUES=ITERATE_VALUES,src_Iterator__Iterator.ENTRIES=ITERATE_ENTRIES,src_Iterator__Iterator.prototype.inspect=src_Iterator__Iterator.prototype.toSource=function(){return this.toString()},src_Iterator__Iterator.prototype[ITERATOR_SYMBOL]=function(){return this},createClass(Seq,Iterable),Seq.of=function(){return Seq(arguments)},Seq.prototype.toSeq=function(){return this},Seq.prototype.toString=function(){return this.__toString("Seq {","}")},Seq.prototype.cacheResult=function(){return!this._cache&&this.__iterateUncached&&(this._cache=this.entrySeq().toArray(),this.size=this._cache.length),this},Seq.prototype.__iterate=function(fn,reverse){return seqIterate(this,fn,reverse,!0)},Seq.prototype.__iterator=function(type,reverse){return seqIterator(this,type,reverse,!0)},createClass(KeyedSeq,Seq),KeyedSeq.prototype.toKeyedSeq=function(){return this},createClass(IndexedSeq,Seq),IndexedSeq.of=function(){return IndexedSeq(arguments)},IndexedSeq.prototype.toIndexedSeq=function(){return this},IndexedSeq.prototype.toString=function(){return this.__toString("Seq [","]")},IndexedSeq.prototype.__iterate=function(fn,reverse){return seqIterate(this,fn,reverse,!1)},IndexedSeq.prototype.__iterator=function(type,reverse){return seqIterator(this,type,reverse,!1)},createClass(SetSeq,Seq),SetSeq.of=function(){return SetSeq(arguments)},SetSeq.prototype.toSetSeq=function(){return this},Seq.isSeq=isSeq,Seq.Keyed=KeyedSeq,Seq.Set=SetSeq,Seq.Indexed=IndexedSeq;var IS_SEQ_SENTINEL="@@__IMMUTABLE_SEQ__@@";Seq.prototype[IS_SEQ_SENTINEL]=!0,createClass(ArraySeq,IndexedSeq),ArraySeq.prototype.get=function(index,notSetValue){return this.has(index)?this._array[wrapIndex(this,index)]:notSetValue},ArraySeq.prototype.__iterate=function(fn,reverse){for(var array=this._array,maxIndex=array.length-1,ii=0;maxIndex>=ii;ii++)if(fn(array[reverse?maxIndex-ii:ii],ii,this)===!1)return ii+1;return ii},ArraySeq.prototype.__iterator=function(type,reverse){var array=this._array,maxIndex=array.length-1,ii=0;return new src_Iterator__Iterator(function(){return ii>maxIndex?iteratorDone():iteratorValue(type,ii,array[reverse?maxIndex-ii++:ii++])})},createClass(ObjectSeq,KeyedSeq),ObjectSeq.prototype.get=function(key,notSetValue){return void 0===notSetValue||this.has(key)?this._object[key]:notSetValue},ObjectSeq.prototype.has=function(key){return this._object.hasOwnProperty(key)},ObjectSeq.prototype.__iterate=function(fn,reverse){for(var object=this._object,keys=this._keys,maxIndex=keys.length-1,ii=0;maxIndex>=ii;ii++){var key=keys[reverse?maxIndex-ii:ii];if(fn(object[key],key,this)===!1)return ii+1}return ii},ObjectSeq.prototype.__iterator=function(type,reverse){var object=this._object,keys=this._keys,maxIndex=keys.length-1,ii=0;return new src_Iterator__Iterator(function(){var key=keys[reverse?maxIndex-ii:ii];return ii++>maxIndex?iteratorDone():iteratorValue(type,key,object[key])})},ObjectSeq.prototype[IS_ORDERED_SENTINEL]=!0,createClass(IterableSeq,IndexedSeq),IterableSeq.prototype.__iterateUncached=function(fn,reverse){if(reverse)return this.cacheResult().__iterate(fn,reverse);var iterable=this._iterable,iterator=getIterator(iterable),iterations=0;if(isIterator(iterator))for(var step;!(step=iterator.next()).done&&fn(step.value,iterations++,this)!==!1;);return iterations},IterableSeq.prototype.__iteratorUncached=function(type,reverse){if(reverse)return this.cacheResult().__iterator(type,reverse);var iterable=this._iterable,iterator=getIterator(iterable);if(!isIterator(iterator))return new src_Iterator__Iterator(iteratorDone);var iterations=0;return new src_Iterator__Iterator(function(){var step=iterator.next();return step.done?step:iteratorValue(type,iterations++,step.value)})},createClass(IteratorSeq,IndexedSeq),IteratorSeq.prototype.__iterateUncached=function(fn,reverse){if(reverse)return this.cacheResult().__iterate(fn,reverse);for(var iterator=this._iterator,cache=this._iteratorCache,iterations=0;iterations<cache.length;)if(fn(cache[iterations],iterations++,this)===!1)return iterations;for(var step;!(step=iterator.next()).done;){var val=step.value;if(cache[iterations]=val,fn(val,iterations++,this)===!1)break}return iterations},IteratorSeq.prototype.__iteratorUncached=function(type,reverse){if(reverse)return this.cacheResult().__iterator(type,reverse);var iterator=this._iterator,cache=this._iteratorCache,iterations=0;return new src_Iterator__Iterator(function(){if(iterations>=cache.length){var step=iterator.next();if(step.done)return step;cache[iterations]=step.value}return iteratorValue(type,iterations,cache[iterations++])})};var EMPTY_SEQ;createClass(Collection,Iterable),createClass(KeyedCollection,Collection),createClass(IndexedCollection,Collection),createClass(SetCollection,Collection),Collection.Keyed=KeyedCollection,Collection.Indexed=IndexedCollection,Collection.Set=SetCollection;var src_Math__imul="function"==typeof Math.imul&&-2===Math.imul(4294967295,2)?Math.imul:function(a,b){a=0|a,b=0|b;var c=65535&a,d=65535&b;return c*d+((a>>>16)*d+c*(b>>>16)<<16>>>0)|0},canDefineProperty=function(){try{return Object.defineProperty({},"@",{}),!0}catch(e){return!1}}(),weakMap="function"==typeof WeakMap&&new WeakMap,objHashUID=0,UID_HASH_KEY="__immutablehash__";"function"==typeof Symbol&&(UID_HASH_KEY=Symbol(UID_HASH_KEY));var STRING_HASH_CACHE_MIN_STRLEN=16,STRING_HASH_CACHE_MAX_SIZE=255,STRING_HASH_CACHE_SIZE=0,stringHashCache={};createClass(ToKeyedSequence,KeyedSeq),ToKeyedSequence.prototype.get=function(key,notSetValue){return this._iter.get(key,notSetValue)},ToKeyedSequence.prototype.has=function(key){return this._iter.has(key)},ToKeyedSequence.prototype.valueSeq=function(){return this._iter.valueSeq()},ToKeyedSequence.prototype.reverse=function(){var this$0=this,reversedSequence=reverseFactory(this,!0);return this._useKeys||(reversedSequence.valueSeq=function(){return this$0._iter.toSeq().reverse()}),reversedSequence},ToKeyedSequence.prototype.map=function(mapper,context){var this$0=this,mappedSequence=mapFactory(this,mapper,context);return this._useKeys||(mappedSequence.valueSeq=function(){return this$0._iter.toSeq().map(mapper,context)}),mappedSequence},ToKeyedSequence.prototype.__iterate=function(fn,reverse){var ii,this$0=this;return this._iter.__iterate(this._useKeys?function(v,k){return fn(v,k,this$0)}:(ii=reverse?resolveSize(this):0,function(v){return fn(v,reverse?--ii:ii++,this$0)}),reverse)},ToKeyedSequence.prototype.__iterator=function(type,reverse){if(this._useKeys)return this._iter.__iterator(type,reverse);var iterator=this._iter.__iterator(ITERATE_VALUES,reverse),ii=reverse?resolveSize(this):0;return new src_Iterator__Iterator(function(){var step=iterator.next();return step.done?step:iteratorValue(type,reverse?--ii:ii++,step.value,step)})},ToKeyedSequence.prototype[IS_ORDERED_SENTINEL]=!0,createClass(ToIndexedSequence,IndexedSeq),ToIndexedSequence.prototype.contains=function(value){return this._iter.contains(value)},ToIndexedSequence.prototype.__iterate=function(fn,reverse){var this$0=this,iterations=0;return this._iter.__iterate(function(v){return fn(v,iterations++,this$0)},reverse)},ToIndexedSequence.prototype.__iterator=function(type,reverse){var iterator=this._iter.__iterator(ITERATE_VALUES,reverse),iterations=0;return new src_Iterator__Iterator(function(){var step=iterator.next();return step.done?step:iteratorValue(type,iterations++,step.value,step)})},createClass(ToSetSequence,SetSeq),ToSetSequence.prototype.has=function(key){return this._iter.contains(key)},ToSetSequence.prototype.__iterate=function(fn,reverse){var this$0=this;return this._iter.__iterate(function(v){return fn(v,v,this$0)},reverse)},ToSetSequence.prototype.__iterator=function(type,reverse){var iterator=this._iter.__iterator(ITERATE_VALUES,reverse);return new src_Iterator__Iterator(function(){var step=iterator.next();return step.done?step:iteratorValue(type,step.value,step.value,step)})},createClass(FromEntriesSequence,KeyedSeq),FromEntriesSequence.prototype.entrySeq=function(){return this._iter.toSeq()},FromEntriesSequence.prototype.__iterate=function(fn,reverse){var this$0=this;return this._iter.__iterate(function(entry){return entry?(validateEntry(entry),fn(entry[1],entry[0],this$0)):void 0},reverse)},FromEntriesSequence.prototype.__iterator=function(type,reverse){var iterator=this._iter.__iterator(ITERATE_VALUES,reverse);return new src_Iterator__Iterator(function(){for(;;){var step=iterator.next();if(step.done)return step;var entry=step.value;if(entry)return validateEntry(entry),type===ITERATE_ENTRIES?step:iteratorValue(type,entry[0],entry[1],step)}})},ToIndexedSequence.prototype.cacheResult=ToKeyedSequence.prototype.cacheResult=ToSetSequence.prototype.cacheResult=FromEntriesSequence.prototype.cacheResult=cacheResultThrough,createClass(src_Map__Map,KeyedCollection),src_Map__Map.prototype.toString=function(){return this.__toString("Map {","}")},src_Map__Map.prototype.get=function(k,notSetValue){return this._root?this._root.get(0,void 0,k,notSetValue):notSetValue},src_Map__Map.prototype.set=function(k,v){return updateMap(this,k,v)},src_Map__Map.prototype.setIn=function(keyPath,v){return this.updateIn(keyPath,NOT_SET,function(){return v})},src_Map__Map.prototype.remove=function(k){return updateMap(this,k,NOT_SET)},src_Map__Map.prototype.deleteIn=function(keyPath){return this.updateIn(keyPath,function(){return NOT_SET})},src_Map__Map.prototype.update=function(k,notSetValue,updater){return 1===arguments.length?k(this):this.updateIn([k],notSetValue,updater)},src_Map__Map.prototype.updateIn=function(keyPath,notSetValue,updater){updater||(updater=notSetValue,notSetValue=void 0);var updatedValue=updateInDeepMap(this,forceIterator(keyPath),notSetValue,updater);return updatedValue===NOT_SET?void 0:updatedValue},src_Map__Map.prototype.clear=function(){return 0===this.size?this:this.__ownerID?(this.size=0,this._root=null,this.__hash=void 0,this.__altered=!0,this):emptyMap()},src_Map__Map.prototype.merge=function(){return mergeIntoMapWith(this,void 0,arguments)},src_Map__Map.prototype.mergeWith=function(merger){var iters=SLICE$0.call(arguments,1);return mergeIntoMapWith(this,merger,iters)},src_Map__Map.prototype.mergeIn=function(keyPath){var iters=SLICE$0.call(arguments,1);return this.updateIn(keyPath,emptyMap(),function(m){return m.merge.apply(m,iters)})},src_Map__Map.prototype.mergeDeep=function(){return mergeIntoMapWith(this,deepMerger(void 0),arguments)},src_Map__Map.prototype.mergeDeepWith=function(merger){var iters=SLICE$0.call(arguments,1);return mergeIntoMapWith(this,deepMerger(merger),iters)},src_Map__Map.prototype.mergeDeepIn=function(keyPath){var iters=SLICE$0.call(arguments,1);return this.updateIn(keyPath,emptyMap(),function(m){return m.mergeDeep.apply(m,iters)})},src_Map__Map.prototype.sort=function(comparator){return OrderedMap(sortFactory(this,comparator))},src_Map__Map.prototype.sortBy=function(mapper,comparator){return OrderedMap(sortFactory(this,comparator,mapper))},src_Map__Map.prototype.withMutations=function(fn){var mutable=this.asMutable();return fn(mutable),mutable.wasAltered()?mutable.__ensureOwner(this.__ownerID):this},src_Map__Map.prototype.asMutable=function(){return this.__ownerID?this:this.__ensureOwner(new OwnerID)},src_Map__Map.prototype.asImmutable=function(){return this.__ensureOwner()},src_Map__Map.prototype.wasAltered=function(){return this.__altered},src_Map__Map.prototype.__iterator=function(type,reverse){return new MapIterator(this,type,reverse)},src_Map__Map.prototype.__iterate=function(fn,reverse){var this$0=this,iterations=0;return this._root&&this._root.iterate(function(entry){return iterations++,fn(entry[1],entry[0],this$0)},reverse),iterations},src_Map__Map.prototype.__ensureOwner=function(ownerID){return ownerID===this.__ownerID?this:ownerID?makeMap(this.size,this._root,ownerID,this.__hash):(this.__ownerID=ownerID,this.__altered=!1,this)},src_Map__Map.isMap=isMap;var IS_MAP_SENTINEL="@@__IMMUTABLE_MAP__@@",MapPrototype=src_Map__Map.prototype;MapPrototype[IS_MAP_SENTINEL]=!0,MapPrototype[DELETE]=MapPrototype.remove,MapPrototype.removeIn=MapPrototype.deleteIn,ArrayMapNode.prototype.get=function(shift,keyHash,key,notSetValue){for(var entries=this.entries,ii=0,len=entries.length;len>ii;ii++)if(is(key,entries[ii][0]))return entries[ii][1];return notSetValue},ArrayMapNode.prototype.update=function(ownerID,shift,keyHash,key,value,didChangeSize,didAlter){for(var removed=value===NOT_SET,entries=this.entries,idx=0,len=entries.length;len>idx&&!is(key,entries[idx][0]);idx++);var exists=len>idx;if(exists?entries[idx][1]===value:removed)return this;if(SetRef(didAlter),(removed||!exists)&&SetRef(didChangeSize),!removed||1!==entries.length){if(!exists&&!removed&&entries.length>=MAX_ARRAY_MAP_SIZE)return createNodes(ownerID,entries,key,value);var isEditable=ownerID&&ownerID===this.ownerID,newEntries=isEditable?entries:arrCopy(entries);return exists?removed?idx===len-1?newEntries.pop():newEntries[idx]=newEntries.pop():newEntries[idx]=[key,value]:newEntries.push([key,value]),isEditable?(this.entries=newEntries,this):new ArrayMapNode(ownerID,newEntries)}},BitmapIndexedNode.prototype.get=function(shift,keyHash,key,notSetValue){void 0===keyHash&&(keyHash=hash(key));var bit=1<<((0===shift?keyHash:keyHash>>>shift)&MASK),bitmap=this.bitmap;return 0===(bitmap&bit)?notSetValue:this.nodes[popCount(bitmap&bit-1)].get(shift+SHIFT,keyHash,key,notSetValue)},BitmapIndexedNode.prototype.update=function(ownerID,shift,keyHash,key,value,didChangeSize,didAlter){void 0===keyHash&&(keyHash=hash(key));var keyHashFrag=(0===shift?keyHash:keyHash>>>shift)&MASK,bit=1<<keyHashFrag,bitmap=this.bitmap,exists=0!==(bitmap&bit);if(!exists&&value===NOT_SET)return this;var idx=popCount(bitmap&bit-1),nodes=this.nodes,node=exists?nodes[idx]:void 0,newNode=updateNode(node,ownerID,shift+SHIFT,keyHash,key,value,didChangeSize,didAlter);if(newNode===node)return this;if(!exists&&newNode&&nodes.length>=MAX_BITMAP_INDEXED_SIZE)return expandNodes(ownerID,nodes,bitmap,keyHashFrag,newNode);if(exists&&!newNode&&2===nodes.length&&isLeafNode(nodes[1^idx]))return nodes[1^idx];if(exists&&newNode&&1===nodes.length&&isLeafNode(newNode))return newNode;var isEditable=ownerID&&ownerID===this.ownerID,newBitmap=exists?newNode?bitmap:bitmap^bit:bitmap|bit,newNodes=exists?newNode?setIn(nodes,idx,newNode,isEditable):spliceOut(nodes,idx,isEditable):spliceIn(nodes,idx,newNode,isEditable);return isEditable?(this.bitmap=newBitmap,this.nodes=newNodes,this):new BitmapIndexedNode(ownerID,newBitmap,newNodes)},HashArrayMapNode.prototype.get=function(shift,keyHash,key,notSetValue){void 0===keyHash&&(keyHash=hash(key));var idx=(0===shift?keyHash:keyHash>>>shift)&MASK,node=this.nodes[idx];return node?node.get(shift+SHIFT,keyHash,key,notSetValue):notSetValue},HashArrayMapNode.prototype.update=function(ownerID,shift,keyHash,key,value,didChangeSize,didAlter){void 0===keyHash&&(keyHash=hash(key));var idx=(0===shift?keyHash:keyHash>>>shift)&MASK,removed=value===NOT_SET,nodes=this.nodes,node=nodes[idx];if(removed&&!node)return this;var newNode=updateNode(node,ownerID,shift+SHIFT,keyHash,key,value,didChangeSize,didAlter);if(newNode===node)return this;var newCount=this.count;if(node){if(!newNode&&(newCount--,MIN_HASH_ARRAY_MAP_SIZE>newCount))return packNodes(ownerID,nodes,newCount,idx)}else newCount++;var isEditable=ownerID&&ownerID===this.ownerID,newNodes=setIn(nodes,idx,newNode,isEditable);return isEditable?(this.count=newCount,this.nodes=newNodes,this):new HashArrayMapNode(ownerID,newCount,newNodes)},HashCollisionNode.prototype.get=function(shift,keyHash,key,notSetValue){for(var entries=this.entries,ii=0,len=entries.length;len>ii;ii++)if(is(key,entries[ii][0]))return entries[ii][1];return notSetValue},HashCollisionNode.prototype.update=function(ownerID,shift,keyHash,key,value,didChangeSize,didAlter){void 0===keyHash&&(keyHash=hash(key));var removed=value===NOT_SET;if(keyHash!==this.keyHash)return removed?this:(SetRef(didAlter),SetRef(didChangeSize),mergeIntoNode(this,ownerID,shift,keyHash,[key,value]));for(var entries=this.entries,idx=0,len=entries.length;len>idx&&!is(key,entries[idx][0]);idx++);var exists=len>idx;if(exists?entries[idx][1]===value:removed)return this;if(SetRef(didAlter),(removed||!exists)&&SetRef(didChangeSize),removed&&2===len)return new ValueNode(ownerID,this.keyHash,entries[1^idx]);var isEditable=ownerID&&ownerID===this.ownerID,newEntries=isEditable?entries:arrCopy(entries);return exists?removed?idx===len-1?newEntries.pop():newEntries[idx]=newEntries.pop():newEntries[idx]=[key,value]:newEntries.push([key,value]),isEditable?(this.entries=newEntries,this):new HashCollisionNode(ownerID,this.keyHash,newEntries)},ValueNode.prototype.get=function(shift,keyHash,key,notSetValue){return is(key,this.entry[0])?this.entry[1]:notSetValue},ValueNode.prototype.update=function(ownerID,shift,keyHash,key,value,didChangeSize,didAlter){var removed=value===NOT_SET,keyMatch=is(key,this.entry[0]);return(keyMatch?value===this.entry[1]:removed)?this:(SetRef(didAlter),removed?void SetRef(didChangeSize):keyMatch?ownerID&&ownerID===this.ownerID?(this.entry[1]=value,this):new ValueNode(ownerID,this.keyHash,[key,value]):(SetRef(didChangeSize),mergeIntoNode(this,ownerID,shift,hash(key),[key,value])))},ArrayMapNode.prototype.iterate=HashCollisionNode.prototype.iterate=function(fn,reverse){for(var entries=this.entries,ii=0,maxIndex=entries.length-1;maxIndex>=ii;ii++)if(fn(entries[reverse?maxIndex-ii:ii])===!1)return!1},BitmapIndexedNode.prototype.iterate=HashArrayMapNode.prototype.iterate=function(fn,reverse){for(var nodes=this.nodes,ii=0,maxIndex=nodes.length-1;maxIndex>=ii;ii++){var node=nodes[reverse?maxIndex-ii:ii];if(node&&node.iterate(fn,reverse)===!1)return!1}},ValueNode.prototype.iterate=function(fn,reverse){return fn(this.entry)},createClass(MapIterator,src_Iterator__Iterator),MapIterator.prototype.next=function(){for(var type=this._type,stack=this._stack;stack;){var maxIndex,node=stack.node,index=stack.index++;if(node.entry){if(0===index)return mapIteratorValue(type,node.entry)}else if(node.entries){if(maxIndex=node.entries.length-1,maxIndex>=index)return mapIteratorValue(type,node.entries[this._reverse?maxIndex-index:index])}else if(maxIndex=node.nodes.length-1,maxIndex>=index){var subNode=node.nodes[this._reverse?maxIndex-index:index];if(subNode){if(subNode.entry)return mapIteratorValue(type,subNode.entry);stack=this._stack=mapIteratorFrame(subNode,stack)}continue}stack=this._stack=this._stack.__prev}return iteratorDone()};var EMPTY_MAP,MAX_ARRAY_MAP_SIZE=SIZE/4,MAX_BITMAP_INDEXED_SIZE=SIZE/2,MIN_HASH_ARRAY_MAP_SIZE=SIZE/4;createClass(List,IndexedCollection),List.of=function(){return this(arguments)},List.prototype.toString=function(){return this.__toString("List [","]")},List.prototype.get=function(index,notSetValue){if(index=wrapIndex(this,index),0>index||index>=this.size)return notSetValue;index+=this._origin;var node=listNodeFor(this,index);return node&&node.array[index&MASK]},List.prototype.set=function(index,value){return updateList(this,index,value)},List.prototype.remove=function(index){return this.has(index)?0===index?this.shift():index===this.size-1?this.pop():this.splice(index,1):this},List.prototype.clear=function(){return 0===this.size?this:this.__ownerID?(this.size=this._origin=this._capacity=0,this._level=SHIFT,this._root=this._tail=null,this.__hash=void 0,this.__altered=!0,this):emptyList()},List.prototype.push=function(){var values=arguments,oldSize=this.size;return this.withMutations(function(list){setListBounds(list,0,oldSize+values.length);for(var ii=0;ii<values.length;ii++)list.set(oldSize+ii,values[ii])})},List.prototype.pop=function(){return setListBounds(this,0,-1)},List.prototype.unshift=function(){var values=arguments;return this.withMutations(function(list){setListBounds(list,-values.length);for(var ii=0;ii<values.length;ii++)list.set(ii,values[ii])})},List.prototype.shift=function(){return setListBounds(this,1)},List.prototype.merge=function(){return mergeIntoListWith(this,void 0,arguments)},List.prototype.mergeWith=function(merger){var iters=SLICE$0.call(arguments,1);return mergeIntoListWith(this,merger,iters)},List.prototype.mergeDeep=function(){return mergeIntoListWith(this,deepMerger(void 0),arguments)},List.prototype.mergeDeepWith=function(merger){var iters=SLICE$0.call(arguments,1);return mergeIntoListWith(this,deepMerger(merger),iters)},List.prototype.setSize=function(size){return setListBounds(this,0,size)},List.prototype.slice=function(begin,end){var size=this.size;return wholeSlice(begin,end,size)?this:setListBounds(this,resolveBegin(begin,size),resolveEnd(end,size))},List.prototype.__iterator=function(type,reverse){var index=0,values=iterateList(this,reverse);return new src_Iterator__Iterator(function(){var value=values();return value===DONE?iteratorDone():iteratorValue(type,index++,value)})},List.prototype.__iterate=function(fn,reverse){for(var value,index=0,values=iterateList(this,reverse);(value=values())!==DONE&&fn(value,index++,this)!==!1;);return index},List.prototype.__ensureOwner=function(ownerID){return ownerID===this.__ownerID?this:ownerID?makeList(this._origin,this._capacity,this._level,this._root,this._tail,ownerID,this.__hash):(this.__ownerID=ownerID,this)},List.isList=isList;var IS_LIST_SENTINEL="@@__IMMUTABLE_LIST__@@",ListPrototype=List.prototype;ListPrototype[IS_LIST_SENTINEL]=!0,ListPrototype[DELETE]=ListPrototype.remove,ListPrototype.setIn=MapPrototype.setIn,ListPrototype.deleteIn=ListPrototype.removeIn=MapPrototype.removeIn,ListPrototype.update=MapPrototype.update,ListPrototype.updateIn=MapPrototype.updateIn,ListPrototype.mergeIn=MapPrototype.mergeIn,ListPrototype.mergeDeepIn=MapPrototype.mergeDeepIn,ListPrototype.withMutations=MapPrototype.withMutations,ListPrototype.asMutable=MapPrototype.asMutable,ListPrototype.asImmutable=MapPrototype.asImmutable,ListPrototype.wasAltered=MapPrototype.wasAltered,VNode.prototype.removeBefore=function(ownerID,level,index){if(index===level?1<<level:0||0===this.array.length)return this;var originIndex=index>>>level&MASK;if(originIndex>=this.array.length)return new VNode([],ownerID);var newChild,removingFirst=0===originIndex;if(level>0){var oldChild=this.array[originIndex];if(newChild=oldChild&&oldChild.removeBefore(ownerID,level-SHIFT,index),newChild===oldChild&&removingFirst)return this}if(removingFirst&&!newChild)return this;var editable=editableVNode(this,ownerID);if(!removingFirst)for(var ii=0;originIndex>ii;ii++)editable.array[ii]=void 0;return newChild&&(editable.array[originIndex]=newChild),editable},VNode.prototype.removeAfter=function(ownerID,level,index){if(index===level?1<<level:0||0===this.array.length)return this;var sizeIndex=index-1>>>level&MASK;if(sizeIndex>=this.array.length)return this;var newChild,removingLast=sizeIndex===this.array.length-1;if(level>0){var oldChild=this.array[sizeIndex];if(newChild=oldChild&&oldChild.removeAfter(ownerID,level-SHIFT,index),newChild===oldChild&&removingLast)return this}if(removingLast&&!newChild)return this;var editable=editableVNode(this,ownerID);return removingLast||editable.array.pop(),newChild&&(editable.array[sizeIndex]=newChild),editable};var EMPTY_LIST,DONE={};createClass(OrderedMap,src_Map__Map),OrderedMap.of=function(){return this(arguments)},OrderedMap.prototype.toString=function(){return this.__toString("OrderedMap {","}")},OrderedMap.prototype.get=function(k,notSetValue){var index=this._map.get(k);return void 0!==index?this._list.get(index)[1]:notSetValue},OrderedMap.prototype.clear=function(){return 0===this.size?this:this.__ownerID?(this.size=0,this._map.clear(),this._list.clear(),this):emptyOrderedMap()},OrderedMap.prototype.set=function(k,v){return updateOrderedMap(this,k,v)},OrderedMap.prototype.remove=function(k){return updateOrderedMap(this,k,NOT_SET)},OrderedMap.prototype.wasAltered=function(){return this._map.wasAltered()||this._list.wasAltered()},OrderedMap.prototype.__iterate=function(fn,reverse){var this$0=this;return this._list.__iterate(function(entry){return entry&&fn(entry[1],entry[0],this$0)},reverse)},OrderedMap.prototype.__iterator=function(type,reverse){return this._list.fromEntrySeq().__iterator(type,reverse)},OrderedMap.prototype.__ensureOwner=function(ownerID){if(ownerID===this.__ownerID)return this;var newMap=this._map.__ensureOwner(ownerID),newList=this._list.__ensureOwner(ownerID);return ownerID?makeOrderedMap(newMap,newList,ownerID,this.__hash):(this.__ownerID=ownerID,this._map=newMap,this._list=newList,this)},OrderedMap.isOrderedMap=isOrderedMap,OrderedMap.prototype[IS_ORDERED_SENTINEL]=!0,OrderedMap.prototype[DELETE]=OrderedMap.prototype.remove;var EMPTY_ORDERED_MAP;createClass(Stack,IndexedCollection),Stack.of=function(){return this(arguments)},Stack.prototype.toString=function(){return this.__toString("Stack [","]")},Stack.prototype.get=function(index,notSetValue){var head=this._head;for(index=wrapIndex(this,index);head&&index--;)head=head.next;return head?head.value:notSetValue},Stack.prototype.peek=function(){return this._head&&this._head.value},Stack.prototype.push=function(){if(0===arguments.length)return this;for(var newSize=this.size+arguments.length,head=this._head,ii=arguments.length-1;ii>=0;ii--)head={value:arguments[ii],next:head};return this.__ownerID?(this.size=newSize,this._head=head,this.__hash=void 0,this.__altered=!0,this):makeStack(newSize,head)},Stack.prototype.pushAll=function(iter){if(iter=IndexedIterable(iter),0===iter.size)return this;assertNotInfinite(iter.size);var newSize=this.size,head=this._head;return iter.reverse().forEach(function(value){newSize++,head={value:value,next:head}}),this.__ownerID?(this.size=newSize,this._head=head,this.__hash=void 0,this.__altered=!0,this):makeStack(newSize,head)},Stack.prototype.pop=function(){return this.slice(1)},Stack.prototype.unshift=function(){return this.push.apply(this,arguments)},Stack.prototype.unshiftAll=function(iter){return this.pushAll(iter)},Stack.prototype.shift=function(){return this.pop.apply(this,arguments)},Stack.prototype.clear=function(){return 0===this.size?this:this.__ownerID?(this.size=0,this._head=void 0,this.__hash=void 0,this.__altered=!0,this):emptyStack()},Stack.prototype.slice=function(begin,end){if(wholeSlice(begin,end,this.size))return this;var resolvedBegin=resolveBegin(begin,this.size),resolvedEnd=resolveEnd(end,this.size);if(resolvedEnd!==this.size)return IndexedCollection.prototype.slice.call(this,begin,end);for(var newSize=this.size-resolvedBegin,head=this._head;resolvedBegin--;)head=head.next;return this.__ownerID?(this.size=newSize,this._head=head,this.__hash=void 0,this.__altered=!0,this):makeStack(newSize,head)},Stack.prototype.__ensureOwner=function(ownerID){return ownerID===this.__ownerID?this:ownerID?makeStack(this.size,this._head,ownerID,this.__hash):(this.__ownerID=ownerID,this.__altered=!1,this)},Stack.prototype.__iterate=function(fn,reverse){if(reverse)return this.reverse().__iterate(fn);for(var iterations=0,node=this._head;node&&fn(node.value,iterations++,this)!==!1;)node=node.next;return iterations},Stack.prototype.__iterator=function(type,reverse){if(reverse)return this.reverse().__iterator(type);var iterations=0,node=this._head;return new src_Iterator__Iterator(function(){if(node){var value=node.value;return node=node.next,iteratorValue(type,iterations++,value)}return iteratorDone()})},Stack.isStack=isStack;var IS_STACK_SENTINEL="@@__IMMUTABLE_STACK__@@",StackPrototype=Stack.prototype;StackPrototype[IS_STACK_SENTINEL]=!0,StackPrototype.withMutations=MapPrototype.withMutations,StackPrototype.asMutable=MapPrototype.asMutable,StackPrototype.asImmutable=MapPrototype.asImmutable,StackPrototype.wasAltered=MapPrototype.wasAltered;var EMPTY_STACK;createClass(src_Set__Set,SetCollection),src_Set__Set.of=function(){return this(arguments)},src_Set__Set.fromKeys=function(value){return this(KeyedIterable(value).keySeq())},src_Set__Set.prototype.toString=function(){
return this.__toString("Set {","}")},src_Set__Set.prototype.has=function(value){return this._map.has(value)},src_Set__Set.prototype.add=function(value){return updateSet(this,this._map.set(value,!0))},src_Set__Set.prototype.remove=function(value){return updateSet(this,this._map.remove(value))},src_Set__Set.prototype.clear=function(){return updateSet(this,this._map.clear())},src_Set__Set.prototype.union=function(){var iters=SLICE$0.call(arguments,0);return iters=iters.filter(function(x){return 0!==x.size}),0===iters.length?this:0===this.size&&1===iters.length?this.constructor(iters[0]):this.withMutations(function(set){for(var ii=0;ii<iters.length;ii++)SetIterable(iters[ii]).forEach(function(value){return set.add(value)})})},src_Set__Set.prototype.intersect=function(){var iters=SLICE$0.call(arguments,0);if(0===iters.length)return this;iters=iters.map(function(iter){return SetIterable(iter)});var originalSet=this;return this.withMutations(function(set){originalSet.forEach(function(value){iters.every(function(iter){return iter.contains(value)})||set.remove(value)})})},src_Set__Set.prototype.subtract=function(){var iters=SLICE$0.call(arguments,0);if(0===iters.length)return this;iters=iters.map(function(iter){return SetIterable(iter)});var originalSet=this;return this.withMutations(function(set){originalSet.forEach(function(value){iters.some(function(iter){return iter.contains(value)})&&set.remove(value)})})},src_Set__Set.prototype.merge=function(){return this.union.apply(this,arguments)},src_Set__Set.prototype.mergeWith=function(merger){var iters=SLICE$0.call(arguments,1);return this.union.apply(this,iters)},src_Set__Set.prototype.sort=function(comparator){return OrderedSet(sortFactory(this,comparator))},src_Set__Set.prototype.sortBy=function(mapper,comparator){return OrderedSet(sortFactory(this,comparator,mapper))},src_Set__Set.prototype.wasAltered=function(){return this._map.wasAltered()},src_Set__Set.prototype.__iterate=function(fn,reverse){var this$0=this;return this._map.__iterate(function(_,k){return fn(k,k,this$0)},reverse)},src_Set__Set.prototype.__iterator=function(type,reverse){return this._map.map(function(_,k){return k}).__iterator(type,reverse)},src_Set__Set.prototype.__ensureOwner=function(ownerID){if(ownerID===this.__ownerID)return this;var newMap=this._map.__ensureOwner(ownerID);return ownerID?this.__make(newMap,ownerID):(this.__ownerID=ownerID,this._map=newMap,this)},src_Set__Set.isSet=isSet;var IS_SET_SENTINEL="@@__IMMUTABLE_SET__@@",SetPrototype=src_Set__Set.prototype;SetPrototype[IS_SET_SENTINEL]=!0,SetPrototype[DELETE]=SetPrototype.remove,SetPrototype.mergeDeep=SetPrototype.merge,SetPrototype.mergeDeepWith=SetPrototype.mergeWith,SetPrototype.withMutations=MapPrototype.withMutations,SetPrototype.asMutable=MapPrototype.asMutable,SetPrototype.asImmutable=MapPrototype.asImmutable,SetPrototype.__empty=emptySet,SetPrototype.__make=makeSet;var EMPTY_SET;createClass(OrderedSet,src_Set__Set),OrderedSet.of=function(){return this(arguments)},OrderedSet.fromKeys=function(value){return this(KeyedIterable(value).keySeq())},OrderedSet.prototype.toString=function(){return this.__toString("OrderedSet {","}")},OrderedSet.isOrderedSet=isOrderedSet;var OrderedSetPrototype=OrderedSet.prototype;OrderedSetPrototype[IS_ORDERED_SENTINEL]=!0,OrderedSetPrototype.__empty=emptyOrderedSet,OrderedSetPrototype.__make=makeOrderedSet;var EMPTY_ORDERED_SET;createClass(Record,KeyedCollection),Record.prototype.toString=function(){return this.__toString(recordName(this)+" {","}")},Record.prototype.has=function(k){return this._defaultValues.hasOwnProperty(k)},Record.prototype.get=function(k,notSetValue){if(!this.has(k))return notSetValue;var defaultVal=this._defaultValues[k];return this._map?this._map.get(k,defaultVal):defaultVal},Record.prototype.clear=function(){if(this.__ownerID)return this._map&&this._map.clear(),this;var SuperRecord=Object.getPrototypeOf(this).constructor;return SuperRecord._empty||(SuperRecord._empty=makeRecord(this,emptyMap()))},Record.prototype.set=function(k,v){if(!this.has(k))throw new Error('Cannot set unknown key "'+k+'" on '+recordName(this));var newMap=this._map&&this._map.set(k,v);return this.__ownerID||newMap===this._map?this:makeRecord(this,newMap)},Record.prototype.remove=function(k){if(!this.has(k))return this;var newMap=this._map&&this._map.remove(k);return this.__ownerID||newMap===this._map?this:makeRecord(this,newMap)},Record.prototype.wasAltered=function(){return this._map.wasAltered()},Record.prototype.__iterator=function(type,reverse){var this$0=this;return KeyedIterable(this._defaultValues).map(function(_,k){return this$0.get(k)}).__iterator(type,reverse)},Record.prototype.__iterate=function(fn,reverse){var this$0=this;return KeyedIterable(this._defaultValues).map(function(_,k){return this$0.get(k)}).__iterate(fn,reverse)},Record.prototype.__ensureOwner=function(ownerID){if(ownerID===this.__ownerID)return this;var newMap=this._map&&this._map.__ensureOwner(ownerID);return ownerID?makeRecord(this,newMap,ownerID):(this.__ownerID=ownerID,this._map=newMap,this)};var RecordPrototype=Record.prototype;RecordPrototype[DELETE]=RecordPrototype.remove,RecordPrototype.deleteIn=RecordPrototype.removeIn=MapPrototype.removeIn,RecordPrototype.merge=MapPrototype.merge,RecordPrototype.mergeWith=MapPrototype.mergeWith,RecordPrototype.mergeIn=MapPrototype.mergeIn,RecordPrototype.mergeDeep=MapPrototype.mergeDeep,RecordPrototype.mergeDeepWith=MapPrototype.mergeDeepWith,RecordPrototype.mergeDeepIn=MapPrototype.mergeDeepIn,RecordPrototype.setIn=MapPrototype.setIn,RecordPrototype.update=MapPrototype.update,RecordPrototype.updateIn=MapPrototype.updateIn,RecordPrototype.withMutations=MapPrototype.withMutations,RecordPrototype.asMutable=MapPrototype.asMutable,RecordPrototype.asImmutable=MapPrototype.asImmutable,createClass(Range,IndexedSeq),Range.prototype.toString=function(){return 0===this.size?"Range []":"Range [ "+this._start+"..."+this._end+(this._step>1?" by "+this._step:"")+" ]"},Range.prototype.get=function(index,notSetValue){return this.has(index)?this._start+wrapIndex(this,index)*this._step:notSetValue},Range.prototype.contains=function(searchValue){var possibleIndex=(searchValue-this._start)/this._step;return possibleIndex>=0&&possibleIndex<this.size&&possibleIndex===Math.floor(possibleIndex)},Range.prototype.slice=function(begin,end){return wholeSlice(begin,end,this.size)?this:(begin=resolveBegin(begin,this.size),end=resolveEnd(end,this.size),begin>=end?new Range(0,0):new Range(this.get(begin,this._end),this.get(end,this._end),this._step))},Range.prototype.indexOf=function(searchValue){var offsetValue=searchValue-this._start;if(offsetValue%this._step===0){var index=offsetValue/this._step;if(index>=0&&index<this.size)return index}return-1},Range.prototype.lastIndexOf=function(searchValue){return this.indexOf(searchValue)},Range.prototype.__iterate=function(fn,reverse){for(var maxIndex=this.size-1,step=this._step,value=reverse?this._start+maxIndex*step:this._start,ii=0;maxIndex>=ii;ii++){if(fn(value,ii,this)===!1)return ii+1;value+=reverse?-step:step}return ii},Range.prototype.__iterator=function(type,reverse){var maxIndex=this.size-1,step=this._step,value=reverse?this._start+maxIndex*step:this._start,ii=0;return new src_Iterator__Iterator(function(){var v=value;return value+=reverse?-step:step,ii>maxIndex?iteratorDone():iteratorValue(type,ii++,v)})},Range.prototype.equals=function(other){return other instanceof Range?this._start===other._start&&this._end===other._end&&this._step===other._step:deepEqual(this,other)};var EMPTY_RANGE;createClass(Repeat,IndexedSeq),Repeat.prototype.toString=function(){return 0===this.size?"Repeat []":"Repeat [ "+this._value+" "+this.size+" times ]"},Repeat.prototype.get=function(index,notSetValue){return this.has(index)?this._value:notSetValue},Repeat.prototype.contains=function(searchValue){return is(this._value,searchValue)},Repeat.prototype.slice=function(begin,end){var size=this.size;return wholeSlice(begin,end,size)?this:new Repeat(this._value,resolveEnd(end,size)-resolveBegin(begin,size))},Repeat.prototype.reverse=function(){return this},Repeat.prototype.indexOf=function(searchValue){return is(this._value,searchValue)?0:-1},Repeat.prototype.lastIndexOf=function(searchValue){return is(this._value,searchValue)?this.size:-1},Repeat.prototype.__iterate=function(fn,reverse){for(var ii=0;ii<this.size;ii++)if(fn(this._value,ii,this)===!1)return ii+1;return ii},Repeat.prototype.__iterator=function(type,reverse){var this$0=this,ii=0;return new src_Iterator__Iterator(function(){return ii<this$0.size?iteratorValue(type,ii++,this$0._value):iteratorDone()})},Repeat.prototype.equals=function(other){return other instanceof Repeat?is(this._value,other._value):deepEqual(other)};var EMPTY_REPEAT;Iterable.Iterator=src_Iterator__Iterator,mixin(Iterable,{toArray:function(){assertNotInfinite(this.size);var array=new Array(this.size||0);return this.valueSeq().__iterate(function(v,i){array[i]=v}),array},toIndexedSeq:function(){return new ToIndexedSequence(this)},toJS:function(){return this.toSeq().map(function(value){return value&&"function"==typeof value.toJS?value.toJS():value}).__toJS()},toJSON:function(){return this.toSeq().map(function(value){return value&&"function"==typeof value.toJSON?value.toJSON():value}).__toJS()},toKeyedSeq:function(){return new ToKeyedSequence(this,!0)},toMap:function(){return src_Map__Map(this.toKeyedSeq())},toObject:function(){assertNotInfinite(this.size);var object={};return this.__iterate(function(v,k){object[k]=v}),object},toOrderedMap:function(){return OrderedMap(this.toKeyedSeq())},toOrderedSet:function(){return OrderedSet(isKeyed(this)?this.valueSeq():this)},toSet:function(){return src_Set__Set(isKeyed(this)?this.valueSeq():this)},toSetSeq:function(){return new ToSetSequence(this)},toSeq:function(){return isIndexed(this)?this.toIndexedSeq():isKeyed(this)?this.toKeyedSeq():this.toSetSeq()},toStack:function(){return Stack(isKeyed(this)?this.valueSeq():this)},toList:function(){return List(isKeyed(this)?this.valueSeq():this)},toString:function(){return"[Iterable]"},__toString:function(head,tail){return 0===this.size?head+tail:head+" "+this.toSeq().map(this.__toStringMapper).join(", ")+" "+tail},concat:function(){var values=SLICE$0.call(arguments,0);return reify(this,concatFactory(this,values))},contains:function(searchValue){return this.some(function(value){return is(value,searchValue)})},entries:function(){return this.__iterator(ITERATE_ENTRIES)},every:function(predicate,context){assertNotInfinite(this.size);var returnValue=!0;return this.__iterate(function(v,k,c){return predicate.call(context,v,k,c)?void 0:(returnValue=!1,!1)}),returnValue},filter:function(predicate,context){return reify(this,filterFactory(this,predicate,context,!0))},find:function(predicate,context,notSetValue){var entry=this.findEntry(predicate,context);return entry?entry[1]:notSetValue},findEntry:function(predicate,context){var found;return this.__iterate(function(v,k,c){return predicate.call(context,v,k,c)?(found=[k,v],!1):void 0}),found},findLastEntry:function(predicate,context){return this.toSeq().reverse().findEntry(predicate,context)},forEach:function(sideEffect,context){return assertNotInfinite(this.size),this.__iterate(context?sideEffect.bind(context):sideEffect)},join:function(separator){assertNotInfinite(this.size),separator=void 0!==separator?""+separator:",";var joined="",isFirst=!0;return this.__iterate(function(v){isFirst?isFirst=!1:joined+=separator,joined+=null!==v&&void 0!==v?v.toString():""}),joined},keys:function(){return this.__iterator(ITERATE_KEYS)},map:function(mapper,context){return reify(this,mapFactory(this,mapper,context))},reduce:function(reducer,initialReduction,context){assertNotInfinite(this.size);var reduction,useFirst;return arguments.length<2?useFirst=!0:reduction=initialReduction,this.__iterate(function(v,k,c){useFirst?(useFirst=!1,reduction=v):reduction=reducer.call(context,reduction,v,k,c)}),reduction},reduceRight:function(reducer,initialReduction,context){var reversed=this.toKeyedSeq().reverse();return reversed.reduce.apply(reversed,arguments)},reverse:function(){return reify(this,reverseFactory(this,!0))},slice:function(begin,end){return reify(this,sliceFactory(this,begin,end,!0))},some:function(predicate,context){return!this.every(not(predicate),context)},sort:function(comparator){return reify(this,sortFactory(this,comparator))},values:function(){return this.__iterator(ITERATE_VALUES)},butLast:function(){return this.slice(0,-1)},isEmpty:function(){return void 0!==this.size?0===this.size:!this.some(function(){return!0})},count:function(predicate,context){return ensureSize(predicate?this.toSeq().filter(predicate,context):this)},countBy:function(grouper,context){return countByFactory(this,grouper,context)},equals:function(other){return deepEqual(this,other)},entrySeq:function(){var iterable=this;if(iterable._cache)return new ArraySeq(iterable._cache);var entriesSequence=iterable.toSeq().map(entryMapper).toIndexedSeq();return entriesSequence.fromEntrySeq=function(){return iterable.toSeq()},entriesSequence},filterNot:function(predicate,context){return this.filter(not(predicate),context)},findLast:function(predicate,context,notSetValue){return this.toKeyedSeq().reverse().find(predicate,context,notSetValue)},first:function(){return this.find(returnTrue)},flatMap:function(mapper,context){return reify(this,flatMapFactory(this,mapper,context))},flatten:function(depth){return reify(this,flattenFactory(this,depth,!0))},fromEntrySeq:function(){return new FromEntriesSequence(this)},get:function(searchKey,notSetValue){return this.find(function(_,key){return is(key,searchKey)},void 0,notSetValue)},getIn:function(searchKeyPath,notSetValue){for(var step,nested=this,iter=forceIterator(searchKeyPath);!(step=iter.next()).done;){var key=step.value;if(nested=nested&&nested.get?nested.get(key,NOT_SET):NOT_SET,nested===NOT_SET)return notSetValue}return nested},groupBy:function(grouper,context){return groupByFactory(this,grouper,context)},has:function(searchKey){return this.get(searchKey,NOT_SET)!==NOT_SET},hasIn:function(searchKeyPath){return this.getIn(searchKeyPath,NOT_SET)!==NOT_SET},isSubset:function(iter){return iter="function"==typeof iter.contains?iter:Iterable(iter),this.every(function(value){return iter.contains(value)})},isSuperset:function(iter){return iter.isSubset(this)},keySeq:function(){return this.toSeq().map(keyMapper).toIndexedSeq()},last:function(){return this.toSeq().reverse().first()},max:function(comparator){return maxFactory(this,comparator)},maxBy:function(mapper,comparator){return maxFactory(this,comparator,mapper)},min:function(comparator){return maxFactory(this,comparator?neg(comparator):defaultNegComparator)},minBy:function(mapper,comparator){return maxFactory(this,comparator?neg(comparator):defaultNegComparator,mapper)},rest:function(){return this.slice(1)},skip:function(amount){return this.slice(Math.max(0,amount))},skipLast:function(amount){return reify(this,this.toSeq().reverse().skip(amount).reverse())},skipWhile:function(predicate,context){return reify(this,skipWhileFactory(this,predicate,context,!0))},skipUntil:function(predicate,context){return this.skipWhile(not(predicate),context)},sortBy:function(mapper,comparator){return reify(this,sortFactory(this,comparator,mapper))},take:function(amount){return this.slice(0,Math.max(0,amount))},takeLast:function(amount){return reify(this,this.toSeq().reverse().take(amount).reverse())},takeWhile:function(predicate,context){return reify(this,takeWhileFactory(this,predicate,context))},takeUntil:function(predicate,context){return this.takeWhile(not(predicate),context)},valueSeq:function(){return this.toIndexedSeq()},hashCode:function(){return this.__hash||(this.__hash=hashIterable(this))}});var IterablePrototype=Iterable.prototype;IterablePrototype[IS_ITERABLE_SENTINEL]=!0,IterablePrototype[ITERATOR_SYMBOL]=IterablePrototype.values,IterablePrototype.__toJS=IterablePrototype.toArray,IterablePrototype.__toStringMapper=quoteString,IterablePrototype.inspect=IterablePrototype.toSource=function(){return this.toString()},IterablePrototype.chain=IterablePrototype.flatMap,function(){try{Object.defineProperty(IterablePrototype,"length",{get:function(){if(!Iterable.noLengthWarning){var stack;try{throw new Error}catch(error){stack=error.stack}if(-1===stack.indexOf("_wrapObject"))return console&&console.warn&&console.warn("iterable.length has been deprecated, use iterable.size or iterable.count(). This warning will become a silent error in a future version. "+stack),this.size}}})}catch(e){}}(),mixin(KeyedIterable,{flip:function(){return reify(this,flipFactory(this))},findKey:function(predicate,context){var entry=this.findEntry(predicate,context);return entry&&entry[0]},findLastKey:function(predicate,context){return this.toSeq().reverse().findKey(predicate,context)},keyOf:function(searchValue){return this.findKey(function(value){return is(value,searchValue)})},lastKeyOf:function(searchValue){return this.findLastKey(function(value){return is(value,searchValue)})},mapEntries:function(mapper,context){var this$0=this,iterations=0;return reify(this,this.toSeq().map(function(v,k){return mapper.call(context,[k,v],iterations++,this$0)}).fromEntrySeq())},mapKeys:function(mapper,context){var this$0=this;return reify(this,this.toSeq().flip().map(function(k,v){return mapper.call(context,k,v,this$0)}).flip())}});var KeyedIterablePrototype=KeyedIterable.prototype;KeyedIterablePrototype[IS_KEYED_SENTINEL]=!0,KeyedIterablePrototype[ITERATOR_SYMBOL]=IterablePrototype.entries,KeyedIterablePrototype.__toJS=IterablePrototype.toObject,KeyedIterablePrototype.__toStringMapper=function(v,k){return k+": "+quoteString(v)},mixin(IndexedIterable,{toKeyedSeq:function(){return new ToKeyedSequence(this,!1)},filter:function(predicate,context){return reify(this,filterFactory(this,predicate,context,!1))},findIndex:function(predicate,context){var entry=this.findEntry(predicate,context);return entry?entry[0]:-1},indexOf:function(searchValue){var key=this.toKeyedSeq().keyOf(searchValue);return void 0===key?-1:key},lastIndexOf:function(searchValue){return this.toSeq().reverse().indexOf(searchValue)},reverse:function(){return reify(this,reverseFactory(this,!1))},slice:function(begin,end){return reify(this,sliceFactory(this,begin,end,!1))},splice:function(index,removeNum){var numArgs=arguments.length;if(removeNum=Math.max(0|removeNum,0),0===numArgs||2===numArgs&&!removeNum)return this;index=resolveBegin(index,this.size);var spliced=this.slice(0,index);return reify(this,1===numArgs?spliced:spliced.concat(arrCopy(arguments,2),this.slice(index+removeNum)))},findLastIndex:function(predicate,context){var key=this.toKeyedSeq().findLastKey(predicate,context);return void 0===key?-1:key},first:function(){return this.get(0)},flatten:function(depth){return reify(this,flattenFactory(this,depth,!1))},get:function(index,notSetValue){return index=wrapIndex(this,index),0>index||this.size===1/0||void 0!==this.size&&index>this.size?notSetValue:this.find(function(_,key){return key===index},void 0,notSetValue)},has:function(index){return index=wrapIndex(this,index),index>=0&&(void 0!==this.size?this.size===1/0||index<this.size:-1!==this.indexOf(index))},interpose:function(separator){return reify(this,interposeFactory(this,separator))},interleave:function(){var iterables=[this].concat(arrCopy(arguments)),zipped=zipWithFactory(this.toSeq(),IndexedSeq.of,iterables),interleaved=zipped.flatten(!0);return zipped.size&&(interleaved.size=zipped.size*iterables.length),reify(this,interleaved)},last:function(){return this.get(-1)},skipWhile:function(predicate,context){return reify(this,skipWhileFactory(this,predicate,context,!1))},zip:function(){var iterables=[this].concat(arrCopy(arguments));return reify(this,zipWithFactory(this,defaultZipper,iterables))},zipWith:function(zipper){var iterables=arrCopy(arguments);return iterables[0]=this,reify(this,zipWithFactory(this,zipper,iterables))}}),IndexedIterable.prototype[IS_INDEXED_SENTINEL]=!0,IndexedIterable.prototype[IS_ORDERED_SENTINEL]=!0,mixin(SetIterable,{get:function(value,notSetValue){return this.has(value)?value:notSetValue},contains:function(value){return this.has(value)},keySeq:function(){return this.valueSeq()}}),SetIterable.prototype.has=IterablePrototype.contains,mixin(KeyedSeq,KeyedIterable.prototype),mixin(IndexedSeq,IndexedIterable.prototype),mixin(SetSeq,SetIterable.prototype),mixin(KeyedCollection,KeyedIterable.prototype),mixin(IndexedCollection,IndexedIterable.prototype),mixin(SetCollection,SetIterable.prototype);var Immutable={Iterable:Iterable,Seq:Seq,Collection:Collection,Map:src_Map__Map,OrderedMap:OrderedMap,List:List,Stack:Stack,Set:src_Set__Set,OrderedSet:OrderedSet,Record:Record,Range:Range,Repeat:Repeat,is:is,fromJS:fromJS};return Immutable})},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var indentCommand=new scribe.api.Command("indent");indentCommand.queryEnabled=function(){var selection=new scribe.api.Selection,listElement=selection.getContaining(function(element){return"UL"===element.nodeName||"OL"===element.nodeName});return scribe.api.Command.prototype.queryEnabled.call(this)&&scribe.allowsBlockElements()&&!listElement},scribe.commands.indent=indentCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var InsertListCommand=function(commandName){scribe.api.Command.call(this,commandName)};InsertListCommand.prototype=Object.create(scribe.api.Command.prototype),InsertListCommand.prototype.constructor=InsertListCommand,InsertListCommand.prototype.execute=function(value){function splitList(listItemElements){if(listItemElements.length>0){var newListNode=document.createElement(listNode.nodeName);listItemElements.forEach(function(listItemElement){newListNode.appendChild(listItemElement)}),listNode.parentNode.insertBefore(newListNode,listNode.nextElementSibling)}}if(this.queryState()){var selection=new scribe.api.Selection,range=selection.range,listNode=selection.getContaining(function(node){return"OL"===node.nodeName||"UL"===node.nodeName}),listItemElement=selection.getContaining(function(node){return"LI"===node.nodeName});scribe.transactionManager.run(function(){if(listItemElement){var nextListItemElements=new scribe.api.Node(listItemElement).nextAll();splitList(nextListItemElements),selection.placeMarkers();var pNode=document.createElement("p");pNode.innerHTML=listItemElement.innerHTML,listNode.parentNode.insertBefore(pNode,listNode.nextElementSibling),listItemElement.parentNode.removeChild(listItemElement)}else{var selectedListItemElements=Array.prototype.map.call(listNode.querySelectorAll("li"),function(listItemElement){return range.intersectsNode(listItemElement)&&listItemElement}).filter(function(listItemElement){return listItemElement}),lastSelectedListItemElement=selectedListItemElements.slice(-1)[0],listItemElementsAfterSelection=new scribe.api.Node(lastSelectedListItemElement).nextAll();splitList(listItemElementsAfterSelection),selection.placeMarkers();var documentFragment=document.createDocumentFragment();selectedListItemElements.forEach(function(listItemElement){var pElement=document.createElement("p");pElement.innerHTML=listItemElement.innerHTML,documentFragment.appendChild(pElement)}),listNode.parentNode.insertBefore(documentFragment,listNode.nextElementSibling),selectedListItemElements.forEach(function(listItemElement){listItemElement.parentNode.removeChild(listItemElement)})}0===listNode.childNodes.length&&listNode.parentNode.removeChild(listNode),selection.selectMarkers()}.bind(this))}else scribe.api.Command.prototype.execute.call(this,value)},InsertListCommand.prototype.queryEnabled=function(){return scribe.api.Command.prototype.queryEnabled.call(this)&&scribe.allowsBlockElements()},scribe.commands.insertOrderedList=new InsertListCommand("insertOrderedList"),scribe.commands.insertUnorderedList=new InsertListCommand("insertUnorderedList")}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var outdentCommand=new scribe.api.Command("outdent");outdentCommand.queryEnabled=function(){var selection=new scribe.api.Selection,listElement=selection.getContaining(function(element){return"UL"===element.nodeName||"OL"===element.nodeName});return scribe.api.Command.prototype.queryEnabled.call(this)&&scribe.allowsBlockElements()&&!listElement},scribe.commands.outdent=outdentCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var redoCommand=new scribe.api.Command("redo");redoCommand.execute=function(){scribe.undoManager.redo()},redoCommand.queryEnabled=function(){return scribe.undoManager.position>0},scribe.commands.redo=redoCommand,scribe.options.undo.enabled&&scribe.el.addEventListener("keydown",function(event){event.shiftKey&&(event.metaKey||event.ctrlKey)&&90===event.keyCode&&(event.preventDefault(),redoCommand.execute())})}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var subscriptCommand=new scribe.api.Command("subscript");scribe.commands.subscript=subscriptCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var superscriptCommand=new scribe.api.Command("superscript");scribe.commands.superscript=superscriptCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var undoCommand=new scribe.api.Command("undo");undoCommand.execute=function(){scribe.undoManager.undo()},undoCommand.queryEnabled=function(){return scribe.undoManager.position<scribe.undoManager.length},scribe.commands.undo=undoCommand,scribe.options.undo.enabled&&scribe.el.addEventListener("keydown",function(event){event.shiftKey||!event.metaKey&&!event.ctrlKey||90!==event.keyCode||(event.preventDefault(),undoCommand.execute())})}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(127),__webpack_require__(128),__webpack_require__(70),__webpack_require__(71)],__WEBPACK_AMD_DEFINE_RESULT__=function(flatten,toArray,elementHelpers,nodeHelpers){function observeDomChanges(el,callback){function includeRealMutations(mutations){var allChangedNodes=flatten(mutations.map(function(mutation){var added=toArray(mutation.addedNodes),removed=toArray(mutation.removedNodes);return added.concat(removed)})),realChangedNodes=allChangedNodes.filter(function(n){return!nodeHelpers.isEmptyTextNode(n)}).filter(function(n){return!elementHelpers.isSelectionMarkerNode(n)});return realChangedNodes.length>0}var MutationObserver=window.MutationObserver||window.WebKitMutationObserver||window.MozMutationObserver,runningPostMutation=!1,observer=new MutationObserver(function(mutations){if(!runningPostMutation&&includeRealMutations(mutations)){runningPostMutation=!0;try{callback()}catch(e){throw e}finally{setTimeout(function(){runningPostMutation=!1},0)}}});return observer.observe(el,{attributes:!0,childList:!0,subtree:!0}),observer}return observeDomChanges}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var boldCommand=new scribe.api.CommandPatch("bold");boldCommand.queryEnabled=function(){var selection=new scribe.api.Selection,headingNode=selection.getContaining(function(node){return/^(H[1-6])$/.test(node.nodeName)});return scribe.api.CommandPatch.prototype.queryEnabled.apply(this,arguments)&&!headingNode},scribe.commandPatches.bold=boldCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";var INVISIBLE_CHAR="\ufeff";return function(){return function(scribe){var indentCommand=new scribe.api.CommandPatch("indent");indentCommand.execute=function(value){scribe.transactionManager.run(function(){var selection=new scribe.api.Selection,range=selection.range,isCaretOnNewLine="P"===range.commonAncestorContainer.nodeName&&"<br>"===range.commonAncestorContainer.innerHTML;if(isCaretOnNewLine){var textNode=document.createTextNode(INVISIBLE_CHAR);range.insertNode(textNode),range.setStart(textNode,0),range.setEnd(textNode,0),selection.selection.removeAllRanges(),selection.selection.addRange(range)}scribe.api.CommandPatch.prototype.execute.call(this,value),selection=new scribe.api.Selection;var blockquoteNode=selection.getContaining(function(node){return"BLOCKQUOTE"===node.nodeName});blockquoteNode&&blockquoteNode.removeAttribute("style")}.bind(this))},scribe.commandPatches.indent=indentCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var insertHTMLCommandPatch=new scribe.api.CommandPatch("insertHTML"),element=scribe.element;insertHTMLCommandPatch.execute=function(value){scribe.transactionManager.run(function(){function sanitize(parentNode){var treeWalker=document.createTreeWalker(parentNode,NodeFilter.SHOW_ELEMENT,null,!1),node=treeWalker.firstChild();if(node)do"SPAN"===node.nodeName?element.unwrap(parentNode,node):(node.style.lineHeight=null,""===node.getAttribute("style")&&node.removeAttribute("style")),sanitize(node);while(node=treeWalker.nextSibling())}scribe.api.CommandPatch.prototype.execute.call(this,value),sanitize(scribe.el)}.bind(this))},scribe.commandPatches.insertHTML=insertHTMLCommandPatch}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var element=scribe.element,nodeHelpers=scribe.node,InsertListCommandPatch=function(commandName){
scribe.api.CommandPatch.call(this,commandName)};InsertListCommandPatch.prototype=Object.create(scribe.api.CommandPatch.prototype),InsertListCommandPatch.prototype.constructor=InsertListCommandPatch,InsertListCommandPatch.prototype.execute=function(value){scribe.transactionManager.run(function(){if(scribe.api.CommandPatch.prototype.execute.call(this,value),this.queryState()){var selection=new scribe.api.Selection,listElement=selection.getContaining(function(node){return"OL"===node.nodeName||"UL"===node.nodeName});if(listElement.nextElementSibling&&0===listElement.nextElementSibling.childNodes.length&&nodeHelpers.removeNode(listElement.nextElementSibling),listElement){var listParentNode=listElement.parentNode;listParentNode&&/^(H[1-6]|P)$/.test(listParentNode.nodeName)&&(selection.placeMarkers(),nodeHelpers.insertAfter(listElement,listParentNode),selection.selectMarkers(),2===listParentNode.childNodes.length&&nodeHelpers.isEmptyTextNode(listParentNode.firstChild)&&nodeHelpers.removeNode(listParentNode),0===listParentNode.childNodes.length&&nodeHelpers.removeNode(listParentNode))}var listItemElements=Array.prototype.slice.call(listElement.childNodes);listItemElements.forEach(function(listItemElement){var listItemElementChildNodes=Array.prototype.slice.call(listItemElement.childNodes);listItemElementChildNodes.forEach(function(listElementChildNode){if("SPAN"===listElementChildNode.nodeName){var spanElement=listElementChildNode;element.unwrap(listItemElement,spanElement)}else listElementChildNode.nodeType===Node.ELEMENT_NODE&&(listElementChildNode.style.lineHeight=null,""===listElementChildNode.getAttribute("style")&&listElementChildNode.removeAttribute("style"))})})}}.bind(this))},scribe.commandPatches.insertOrderedList=new InsertListCommandPatch("insertOrderedList"),scribe.commandPatches.insertUnorderedList=new InsertListCommandPatch("insertUnorderedList")}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var outdentCommand=new scribe.api.CommandPatch("outdent");outdentCommand.execute=function(){scribe.transactionManager.run(function(){var selection=new scribe.api.Selection,range=selection.range,blockquoteNode=selection.getContaining(function(node){return"BLOCKQUOTE"===node.nodeName});if("BLOCKQUOTE"===range.commonAncestorContainer.nodeName){selection.placeMarkers(),selection.selectMarkers(!0);var selectedNodes=range.cloneContents();blockquoteNode.parentNode.insertBefore(selectedNodes,blockquoteNode),range.deleteContents(),selection.selectMarkers(),""===blockquoteNode.textContent&&blockquoteNode.parentNode.removeChild(blockquoteNode)}else{var pNode=selection.getContaining(function(node){return"P"===node.nodeName});if(pNode){var nextSiblingNodes=new scribe.api.Node(pNode).nextAll();if(nextSiblingNodes.length){var newContainerNode=document.createElement(blockquoteNode.nodeName);nextSiblingNodes.forEach(function(siblingNode){newContainerNode.appendChild(siblingNode)}),blockquoteNode.parentNode.insertBefore(newContainerNode,blockquoteNode.nextElementSibling)}selection.placeMarkers(),blockquoteNode.parentNode.insertBefore(pNode,blockquoteNode.nextElementSibling),selection.selectMarkers(),""===blockquoteNode.innerHTML&&blockquoteNode.parentNode.removeChild(blockquoteNode)}else scribe.api.CommandPatch.prototype.execute.call(this)}}.bind(this))},scribe.commandPatches.outdent=outdentCommand}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var createLinkCommand=new scribe.api.CommandPatch("createLink");scribe.commandPatches.createLink=createLinkCommand,createLinkCommand.execute=function(value){var selection=new scribe.api.Selection;if(selection.range.collapsed){var aElement=document.createElement("a");aElement.setAttribute("href",value),aElement.textContent=value,selection.range.insertNode(aElement);var newRange=document.createRange();newRange.setStartBefore(aElement),newRange.setEndAfter(aElement),selection.selection.removeAllRanges(),selection.selection.addRange(newRange)}else scribe.api.CommandPatch.prototype.execute.call(this,value)}}}}.call(exports,__webpack_require__,exports,module),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){"use strict";return function(){return function(scribe){var element=scribe.element;scribe.allowsBlockElements()&&scribe.el.addEventListener("keyup",function(event){if(8===event.keyCode||46===event.keyCode){var selection=new scribe.api.Selection,containerPElement=selection.getContaining(function(node){return"P"===node.nodeName});containerPElement&&scribe.transactionManager.run(function(){selection.placeMarkers();var pElementChildNodes=Array.prototype.slice.call(containerPElement.childNodes);pElementChildNodes.forEach(function(pElementChildNode){if("SPAN"===pElementChildNode.nodeName){var spanElement=pElementChildNode;element.unwrap(containerPElement,spanElement)}else pElementChildNode.nodeType===Node.ELEMENT_NODE&&(pElementChildNode.style.lineHeight=null,""===pElementChildNode.getAttribute("style")&&pElementChildNode.removeAttribute("style"))}),selection.selectMarkers()},!0)}})}}}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){function baseCreateCallback(func,thisArg,argCount){if("function"!=typeof func)return identity;if("undefined"==typeof thisArg||!("prototype"in func))return func;var bindData=func.__bindData__;if("undefined"==typeof bindData&&(support.funcNames&&(bindData=!func.name),bindData=bindData||!support.funcDecomp,!bindData)){var source=fnToString.call(func);support.funcNames||(bindData=!reFuncName.test(source)),bindData||(bindData=reThis.test(source),setBindData(func,bindData))}if(bindData===!1||bindData!==!0&&1&bindData[1])return func;switch(argCount){case 1:return function(value){return func.call(thisArg,value)};case 2:return function(a,b){return func.call(thisArg,a,b)};case 3:return function(value,index,collection){return func.call(thisArg,value,index,collection)};case 4:return function(accumulator,value,index,collection){return func.call(thisArg,accumulator,value,index,collection)}}return bind(func,thisArg)}var bind=__webpack_require__(143),identity=__webpack_require__(144),setBindData=__webpack_require__(145),support=__webpack_require__(146),reFuncName=/^\s*function[ \n\r\t]+\w/,reThis=/\bthis\b/,fnToString=Function.prototype.toString;module.exports=baseCreateCallback},function(module,exports,__webpack_require__){var isNative=__webpack_require__(147),isObject=__webpack_require__(54),shimKeys=__webpack_require__(148),nativeKeys=isNative(nativeKeys=Object.keys)&&nativeKeys,keys=nativeKeys?function(object){return isObject(object)?nativeKeys(object):[]}:shimKeys;module.exports=keys},function(module,exports,__webpack_require__){var objectTypes={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1};module.exports=objectTypes},function(module,exports,__webpack_require__){var objectTypes={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1};module.exports=objectTypes},function(module,exports,__webpack_require__){function escapeHtmlChar(match){return htmlEscapes[match]}var htmlEscapes=__webpack_require__(149);module.exports=escapeHtmlChar},function(module,exports,__webpack_require__){var htmlEscapes=__webpack_require__(150),keys=__webpack_require__(87),reUnescapedHtml=RegExp("["+keys(htmlEscapes).join("")+"]","g");module.exports=reUnescapedHtml},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){var objectTypes=__webpack_require__(151),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,shimKeys=function(object){var index,iterable=object,result=[];if(!iterable)return result;if(!objectTypes[typeof object])return result;for(index in iterable)hasOwnProperty.call(iterable,index)&&result.push(index);return result};module.exports=shimKeys},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(129),__webpack_require__(130),__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreateCallback,keys,objectTypes){var assign=function(object,source,guard){var index,iterable=object,result=iterable;if(!iterable)return result;var args=arguments,argsIndex=0,argsLength="number"==typeof guard?2:args.length;if(argsLength>3&&"function"==typeof args[argsLength-2])var callback=baseCreateCallback(args[--argsLength-1],args[argsLength--],2);else argsLength>2&&"function"==typeof args[argsLength-1]&&(callback=args[--argsLength]);for(;++argsIndex<argsLength;)if(iterable=args[argsIndex],iterable&&objectTypes[typeof iterable])for(var ownIndex=-1,ownProps=objectTypes[typeof iterable]&&keys(iterable),length=ownProps?ownProps.length:0;++ownIndex<length;)index=ownProps[ownIndex],result[index]=callback?callback(result[index],iterable[index]):iterable[index];return result};return assign}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(130),__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(keys,objectTypes){var defaults=function(object,source,guard){var index,iterable=object,result=iterable;if(!iterable)return result;for(var args=arguments,argsIndex=0,argsLength="number"==typeof guard?2:args.length;++argsIndex<argsLength;)if(iterable=args[argsIndex],iterable&&objectTypes[typeof iterable])for(var ownIndex=-1,ownProps=objectTypes[typeof iterable]&&keys(iterable),length=ownProps?ownProps.length:0;++ownIndex<length;)index=ownProps[ownIndex],"undefined"==typeof result[index]&&(result[index]=iterable[index]);return result};return defaults}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function pull(array){for(var args=arguments,argsIndex=0,argsLength=args.length,length=array?array.length:0;++argsIndex<argsLength;)for(var index=-1,value=args[argsIndex];++index<length;)array[index]===value&&(splice.call(array,index--,1),length--);return array}var arrayRef=[],splice=arrayRef.splice;return pull}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(132),__webpack_require__(133)],__WEBPACK_AMD_DEFINE_RESULT__=function(createCallback,slice){function last(array,callback,thisArg){var n=0,length=array?array.length:0;if("number"!=typeof callback&&null!=callback){var index=length;for(callback=createCallback(callback,thisArg,3);index--&&callback(array[index],index,array);)n++}else if(n=callback,null==n||thisArg)return array?array[length-1]:undefined;return slice(array,nativeMax(0,length-n))}var undefined,nativeMax=Math.max;return last}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(134),__webpack_require__(135),__webpack_require__(136),__webpack_require__(137)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseIndexOf,forOwn,isArray,isString){function contains(collection,target,fromIndex){var index=-1,indexOf=baseIndexOf,length=collection?collection.length:0,result=!1;return fromIndex=(0>fromIndex?nativeMax(0,length+fromIndex):fromIndex)||0,isArray(collection)?result=indexOf(collection,target,fromIndex)>-1:"number"==typeof length?result=(isString(collection)?collection.indexOf(target,fromIndex):indexOf(collection,target,fromIndex))>-1:forOwn(collection,function(value){return++index>=fromIndex?!(result=value===target):void 0}),result}var nativeMax=Math.max;return contains}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(138),__webpack_require__(130),__webpack_require__(139)],__WEBPACK_AMD_DEFINE_RESULT__=function(escapeHtmlChar,keys,reUnescapedHtml){function escape(string){return null==string?"":String(string).replace(reUnescapedHtml,escapeHtmlChar)}return escape}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(140),__webpack_require__(141)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseFlatten,map){function flatten(array,isShallow,callback,thisArg){return"boolean"!=typeof isShallow&&null!=isShallow&&(thisArg=callback,callback="function"!=typeof isShallow&&thisArg&&thisArg[isShallow]===array?null:isShallow,isShallow=!1),null!=callback&&(array=map(array,callback,thisArg)),baseFlatten(array,isShallow)}return flatten}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(137),__webpack_require__(133),__webpack_require__(142)],__WEBPACK_AMD_DEFINE_RESULT__=function(isString,slice,values){function toArray(collection){return collection&&"number"==typeof collection.length?slice(collection):values(collection)}return toArray}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(152),__webpack_require__(153),__webpack_require__(154),__webpack_require__(155)],__WEBPACK_AMD_DEFINE_RESULT__=function(bind,identity,setBindData,support){function baseCreateCallback(func,thisArg,argCount){if("function"!=typeof func)return identity;if("undefined"==typeof thisArg||!("prototype"in func))return func;var bindData=func.__bindData__;if("undefined"==typeof bindData&&(support.funcNames&&(bindData=!func.name),bindData=bindData||!support.funcDecomp,!bindData)){var source=fnToString.call(func);support.funcNames||(bindData=!reFuncName.test(source)),bindData||(bindData=reThis.test(source),setBindData(func,bindData))}if(bindData===!1||bindData!==!0&&1&bindData[1])return func;switch(argCount){case 1:return function(value){return func.call(thisArg,value)};case 2:return function(a,b){return func.call(thisArg,a,b)};case 3:return function(value,index,collection){return func.call(thisArg,value,index,collection)};case 4:return function(accumulator,value,index,collection){return func.call(thisArg,accumulator,value,index,collection)}}return bind(func,thisArg)}var reFuncName=/^\s*function[ \n\r\t]+\w/,reThis=/\bthis\b/,fnToString=Function.prototype.toString;return baseCreateCallback}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(156),__webpack_require__(157),__webpack_require__(158)],__WEBPACK_AMD_DEFINE_RESULT__=function(isNative,isObject,shimKeys){var nativeKeys=isNative(nativeKeys=Object.keys)&&nativeKeys,keys=nativeKeys?function(object){return isObject(object)?nativeKeys(object):[]}:shimKeys;return keys}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){var objectTypes={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1};return objectTypes}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(129),__webpack_require__(159),__webpack_require__(157),__webpack_require__(130),__webpack_require__(160)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreateCallback,baseIsEqual,isObject,keys,property){function createCallback(func,thisArg,argCount){var type=typeof func;if(null==func||"function"==type)return baseCreateCallback(func,thisArg,argCount);if("object"!=type)return property(func);var props=keys(func),key=props[0],a=func[key];return 1!=props.length||a!==a||isObject(a)?function(object){for(var length=props.length,result=!1;length--&&(result=baseIsEqual(object[props[length]],func[props[length]],null,!0)););return result}:function(object){var b=object[key];return a===b&&(0!==a||1/a==1/b)}}return createCallback}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function slice(array,start,end){start||(start=0),"undefined"==typeof end&&(end=array?array.length:0);for(var index=-1,length=end-start||0,result=Array(0>length?0:length);++index<length;)result[index]=array[start+index];return result}return slice}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function baseIndexOf(array,value,fromIndex){for(var index=(fromIndex||0)-1,length=array?array.length:0;++index<length;)if(array[index]===value)return index;return-1}return baseIndexOf}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(129),__webpack_require__(130),__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreateCallback,keys,objectTypes){var forOwn=function(collection,callback,thisArg){var index,iterable=collection,result=iterable;if(!iterable)return result;if(!objectTypes[typeof iterable])return result;callback=callback&&"undefined"==typeof thisArg?callback:baseCreateCallback(callback,thisArg,3);for(var ownIndex=-1,ownProps=objectTypes[typeof iterable]&&keys(iterable),length=ownProps?ownProps.length:0;++ownIndex<length;)if(index=ownProps[ownIndex],callback(iterable[index],index,collection)===!1)return result;return result};return forOwn}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(156)],__WEBPACK_AMD_DEFINE_RESULT__=function(isNative){var arrayClass="[object Array]",objectProto=Object.prototype,toString=objectProto.toString,nativeIsArray=isNative(nativeIsArray=Array.isArray)&&nativeIsArray,isArray=nativeIsArray||function(value){return value&&"object"==typeof value&&"number"==typeof value.length&&toString.call(value)==arrayClass||!1};return isArray}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function isString(value){return"string"==typeof value||value&&"object"==typeof value&&toString.call(value)==stringClass||!1}var stringClass="[object String]",objectProto=Object.prototype,toString=objectProto.toString;return isString}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(161)],__WEBPACK_AMD_DEFINE_RESULT__=function(htmlEscapes){function escapeHtmlChar(match){return htmlEscapes[match]}return escapeHtmlChar}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(161),__webpack_require__(130)],__WEBPACK_AMD_DEFINE_RESULT__=function(htmlEscapes,keys){var reUnescapedHtml=RegExp("["+keys(htmlEscapes).join("")+"]","g");return reUnescapedHtml}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(162),__webpack_require__(136)],__WEBPACK_AMD_DEFINE_RESULT__=function(isArguments,isArray){function baseFlatten(array,isShallow,isStrict,fromIndex){for(var index=(fromIndex||0)-1,length=array?array.length:0,result=[];++index<length;){var value=array[index];if(value&&"object"==typeof value&&"number"==typeof value.length&&(isArray(value)||isArguments(value))){isShallow||(value=baseFlatten(value,isShallow,isStrict));var valIndex=-1,valLength=value.length,resIndex=result.length;for(result.length+=valLength;++valIndex<valLength;)result[resIndex++]=value[valIndex]}else isStrict||result.push(value)}return result}return baseFlatten}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(132),__webpack_require__(135)],__WEBPACK_AMD_DEFINE_RESULT__=function(createCallback,forOwn){function map(collection,callback,thisArg){var index=-1,length=collection?collection.length:0;if(callback=createCallback(callback,thisArg,3),"number"==typeof length)for(var result=Array(length);++index<length;)result[index]=callback(collection[index],index,collection);else result=[],forOwn(collection,function(value,key,collection){result[++index]=callback(value,key,collection)});return result}return map}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(130)],__WEBPACK_AMD_DEFINE_RESULT__=function(keys){function values(object){for(var index=-1,props=keys(object),length=props.length,result=Array(length);++index<length;)result[index]=object[props[index]];return result}return values}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){function bind(func,thisArg){return arguments.length>2?createWrapper(func,17,slice(arguments,2),null,thisArg):createWrapper(func,1,null,null,thisArg)}var createWrapper=__webpack_require__(169),slice=__webpack_require__(170);module.exports=bind},function(module,exports,__webpack_require__){function identity(value){return value}module.exports=identity},function(module,exports,__webpack_require__){var isNative=__webpack_require__(171),noop=__webpack_require__(172),descriptor={configurable:!1,enumerable:!1,value:null,writable:!1},defineProperty=function(){try{var o={},func=isNative(func=Object.defineProperty)&&func,result=func(o,o,o)&&func}catch(e){}return result}(),setBindData=defineProperty?function(func,value){descriptor.value=value,defineProperty(func,"__bindData__",descriptor)}:noop;module.exports=setBindData},function(module,exports,__webpack_require__){(function(global){var isNative=__webpack_require__(173),reThis=/\bthis\b/,support={};support.funcDecomp=!isNative(global.WinRTError)&&reThis.test(function(){return this}),support.funcNames="string"==typeof Function.name,module.exports=support}).call(exports,function(){return this}())},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){var objectTypes=__webpack_require__(115),objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,shimKeys=function(object){var index,iterable=object,result=[];if(!iterable)return result;if(!objectTypes[typeof object])return result;for(index in iterable)hasOwnProperty.call(iterable,index)&&result.push(index);return result};module.exports=shimKeys},function(module,exports,__webpack_require__){var htmlEscapes={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};module.exports=htmlEscapes},function(module,exports,__webpack_require__){var htmlEscapes={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};module.exports=htmlEscapes},function(module,exports,__webpack_require__){var objectTypes={"boolean":!1,"function":!0,object:!0,number:!1,string:!1,undefined:!1};module.exports=objectTypes},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(163),__webpack_require__(133)],__WEBPACK_AMD_DEFINE_RESULT__=function(createWrapper,slice){function bind(func,thisArg){return arguments.length>2?createWrapper(func,17,slice(arguments,2),null,thisArg):createWrapper(func,1,null,null,thisArg)}return bind}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function identity(value){return value}return identity}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(156),__webpack_require__(164)],__WEBPACK_AMD_DEFINE_RESULT__=function(isNative,noop){var descriptor={configurable:!1,enumerable:!1,value:null,writable:!1},defineProperty=function(){try{var o={},func=isNative(func=Object.defineProperty)&&func,result=func(o,o,o)&&func}catch(e){}return result}(),setBindData=defineProperty?function(func,value){descriptor.value=value,defineProperty(func,"__bindData__",descriptor)}:noop;return setBindData}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(156)],__WEBPACK_AMD_DEFINE_RESULT__=function(isNative){var reThis=/\bthis\b/,support={};return support.funcDecomp=!isNative(window.WinRTError)&&reThis.test(function(){return this}),support.funcNames="string"==typeof Function.name,support}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");return isNative}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(objectTypes){function isObject(value){return!(!value||!objectTypes[typeof value])}return isObject}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(objectTypes){var objectProto=Object.prototype,hasOwnProperty=objectProto.hasOwnProperty,shimKeys=function(object){var index,iterable=object,result=[];if(!iterable)return result;if(!objectTypes[typeof object])return result;for(index in iterable)hasOwnProperty.call(iterable,index)&&result.push(index);return result};return shimKeys}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(165),__webpack_require__(166),__webpack_require__(167),__webpack_require__(131),__webpack_require__(168)],__WEBPACK_AMD_DEFINE_RESULT__=function(forIn,getArray,isFunction,objectTypes,releaseArray){function baseIsEqual(a,b,callback,isWhere,stackA,stackB){if(callback){var result=callback(a,b);if("undefined"!=typeof result)return!!result}if(a===b)return 0!==a||1/a==1/b;var type=typeof a,otherType=typeof b;if(!(a!==a||a&&objectTypes[type]||b&&objectTypes[otherType]))return!1;if(null==a||null==b)return a===b;var className=toString.call(a),otherClass=toString.call(b);

if(className==argsClass&&(className=objectClass),otherClass==argsClass&&(otherClass=objectClass),className!=otherClass)return!1;switch(className){case boolClass:case dateClass:return+a==+b;case numberClass:return a!=+a?b!=+b:0==a?1/a==1/b:a==+b;case regexpClass:case stringClass:return a==String(b)}var isArr=className==arrayClass;if(!isArr){var aWrapped=hasOwnProperty.call(a,"__wrapped__"),bWrapped=hasOwnProperty.call(b,"__wrapped__");if(aWrapped||bWrapped)return baseIsEqual(aWrapped?a.__wrapped__:a,bWrapped?b.__wrapped__:b,callback,isWhere,stackA,stackB);if(className!=objectClass)return!1;var ctorA=a.constructor,ctorB=b.constructor;if(ctorA!=ctorB&&!(isFunction(ctorA)&&ctorA instanceof ctorA&&isFunction(ctorB)&&ctorB instanceof ctorB)&&"constructor"in a&&"constructor"in b)return!1}var initedStack=!stackA;stackA||(stackA=getArray()),stackB||(stackB=getArray());for(var length=stackA.length;length--;)if(stackA[length]==a)return stackB[length]==b;var size=0;if(result=!0,stackA.push(a),stackB.push(b),isArr){if(length=a.length,size=b.length,result=size==length,result||isWhere)for(;size--;){var index=length,value=b[size];if(isWhere)for(;index--&&!(result=baseIsEqual(a[index],value,callback,isWhere,stackA,stackB)););else if(!(result=baseIsEqual(a[size],value,callback,isWhere,stackA,stackB)))break}}else forIn(b,function(value,key,b){return hasOwnProperty.call(b,key)?(size++,result=hasOwnProperty.call(a,key)&&baseIsEqual(a[key],value,callback,isWhere,stackA,stackB)):void 0}),result&&!isWhere&&forIn(a,function(value,key,a){return hasOwnProperty.call(a,key)?result=--size>-1:void 0});return stackA.pop(),stackB.pop(),initedStack&&(releaseArray(stackA),releaseArray(stackB)),result}var argsClass="[object Arguments]",arrayClass="[object Array]",boolClass="[object Boolean]",dateClass="[object Date]",numberClass="[object Number]",objectClass="[object Object]",regexpClass="[object RegExp]",stringClass="[object String]",objectProto=Object.prototype,toString=objectProto.toString,hasOwnProperty=objectProto.hasOwnProperty;return baseIsEqual}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function property(key){return function(object){return object[key]}}return property}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){var htmlEscapes={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"};return htmlEscapes}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function isArguments(value){return value&&"object"==typeof value&&"number"==typeof value.length&&toString.call(value)==argsClass||!1}var argsClass="[object Arguments]",objectProto=Object.prototype,toString=objectProto.toString;return isArguments}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(174),__webpack_require__(175),__webpack_require__(167),__webpack_require__(133)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseBind,baseCreateWrapper,isFunction,slice){function createWrapper(func,bitmask,partialArgs,partialRightArgs,thisArg,arity){var isBind=1&bitmask,isBindKey=2&bitmask,isCurry=4&bitmask,isPartial=16&bitmask,isPartialRight=32&bitmask;if(!isBindKey&&!isFunction(func))throw new TypeError;isPartial&&!partialArgs.length&&(bitmask&=-17,isPartial=partialArgs=!1),isPartialRight&&!partialRightArgs.length&&(bitmask&=-33,isPartialRight=partialRightArgs=!1);var bindData=func&&func.__bindData__;if(bindData&&bindData!==!0)return bindData=slice(bindData),bindData[2]&&(bindData[2]=slice(bindData[2])),bindData[3]&&(bindData[3]=slice(bindData[3])),!isBind||1&bindData[1]||(bindData[4]=thisArg),!isBind&&1&bindData[1]&&(bitmask|=8),!isCurry||4&bindData[1]||(bindData[5]=arity),isPartial&&push.apply(bindData[2]||(bindData[2]=[]),partialArgs),isPartialRight&&unshift.apply(bindData[3]||(bindData[3]=[]),partialRightArgs),bindData[1]|=bitmask,createWrapper.apply(null,bindData);var creater=1==bitmask||17===bitmask?baseBind:baseCreateWrapper;return creater([func,bitmask,partialArgs,partialRightArgs,thisArg,arity])}var arrayRef=[],push=arrayRef.push,unshift=arrayRef.unshift;return createWrapper}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function noop(){}return noop}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(129),__webpack_require__(131)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreateCallback,objectTypes){var forIn=function(collection,callback,thisArg){var index,iterable=collection,result=iterable;if(!iterable)return result;if(!objectTypes[typeof iterable])return result;callback=callback&&"undefined"==typeof thisArg?callback:baseCreateCallback(callback,thisArg,3);for(index in iterable)if(callback(iterable[index],index,collection)===!1)return result;return result};return forIn}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(176)],__WEBPACK_AMD_DEFINE_RESULT__=function(arrayPool){function getArray(){return arrayPool.pop()||[]}return getArray}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){function isFunction(value){return"function"==typeof value}return isFunction}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(176),__webpack_require__(177)],__WEBPACK_AMD_DEFINE_RESULT__=function(arrayPool,maxPoolSize){function releaseArray(array){array.length=0,arrayPool.length<maxPoolSize&&arrayPool.push(array)}return releaseArray}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){function createWrapper(func,bitmask,partialArgs,partialRightArgs,thisArg,arity){var isBind=1&bitmask,isBindKey=2&bitmask,isCurry=4&bitmask,isPartial=16&bitmask,isPartialRight=32&bitmask;if(!isBindKey&&!isFunction(func))throw new TypeError;isPartial&&!partialArgs.length&&(bitmask&=-17,isPartial=partialArgs=!1),isPartialRight&&!partialRightArgs.length&&(bitmask&=-33,isPartialRight=partialRightArgs=!1);var bindData=func&&func.__bindData__;if(bindData&&bindData!==!0)return bindData=slice(bindData),bindData[2]&&(bindData[2]=slice(bindData[2])),bindData[3]&&(bindData[3]=slice(bindData[3])),!isBind||1&bindData[1]||(bindData[4]=thisArg),!isBind&&1&bindData[1]&&(bitmask|=8),!isCurry||4&bindData[1]||(bindData[5]=arity),isPartial&&push.apply(bindData[2]||(bindData[2]=[]),partialArgs),isPartialRight&&unshift.apply(bindData[3]||(bindData[3]=[]),partialRightArgs),bindData[1]|=bitmask,createWrapper.apply(null,bindData);var creater=1==bitmask||17===bitmask?baseBind:baseCreateWrapper;return creater([func,bitmask,partialArgs,partialRightArgs,thisArg,arity])}var baseBind=__webpack_require__(178),baseCreateWrapper=__webpack_require__(179),isFunction=__webpack_require__(53),slice=__webpack_require__(170),arrayRef=[],push=arrayRef.push,unshift=arrayRef.unshift;module.exports=createWrapper},function(module,exports,__webpack_require__){function slice(array,start,end){start||(start=0),"undefined"==typeof end&&(end=array?array.length:0);for(var index=-1,length=end-start||0,result=Array(0>length?0:length);++index<length;)result[index]=array[start+index];return result}module.exports=slice},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){function noop(){}module.exports=noop},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(180),__webpack_require__(157),__webpack_require__(154),__webpack_require__(133)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreate,isObject,setBindData,slice){function baseBind(bindData){function bound(){if(partialArgs){var args=slice(partialArgs);push.apply(args,arguments)}if(this instanceof bound){var thisBinding=baseCreate(func.prototype),result=func.apply(thisBinding,args||arguments);return isObject(result)?result:thisBinding}return func.apply(thisArg,args||arguments)}var func=bindData[0],partialArgs=bindData[2],thisArg=bindData[4];return setBindData(bound,bindData),bound}var arrayRef=[],push=arrayRef.push;return baseBind}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(180),__webpack_require__(157),__webpack_require__(154),__webpack_require__(133)],__WEBPACK_AMD_DEFINE_RESULT__=function(baseCreate,isObject,setBindData,slice){function baseCreateWrapper(bindData){function bound(){var thisBinding=isBind?thisArg:this;if(partialArgs){var args=slice(partialArgs);push.apply(args,arguments)}if((partialRightArgs||isCurry)&&(args||(args=slice(arguments)),partialRightArgs&&push.apply(args,partialRightArgs),isCurry&&args.length<arity))return bitmask|=16,baseCreateWrapper([func,isCurryBound?bitmask:-4&bitmask,args,null,thisArg,arity]);if(args||(args=arguments),isBindKey&&(func=thisBinding[key]),this instanceof bound){thisBinding=baseCreate(func.prototype);var result=func.apply(thisBinding,args);return isObject(result)?result:thisBinding}return func.apply(thisBinding,args)}var func=bindData[0],bitmask=bindData[1],partialArgs=bindData[2],partialRightArgs=bindData[3],thisArg=bindData[4],arity=bindData[5],isBind=1&bitmask,isBindKey=2&bitmask,isCurry=4&bitmask,isCurryBound=8&bitmask,key=func;return setBindData(bound,bindData),bound}var arrayRef=[],push=arrayRef.push;return baseCreateWrapper}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){var arrayPool=[];return arrayPool}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[],__WEBPACK_AMD_DEFINE_RESULT__=function(){var maxPoolSize=40;return maxPoolSize}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){function baseBind(bindData){function bound(){if(partialArgs){var args=slice(partialArgs);push.apply(args,arguments)}if(this instanceof bound){var thisBinding=baseCreate(func.prototype),result=func.apply(thisBinding,args||arguments);return isObject(result)?result:thisBinding}return func.apply(thisArg,args||arguments)}var func=bindData[0],partialArgs=bindData[2],thisArg=bindData[4];return setBindData(bound,bindData),bound}var baseCreate=__webpack_require__(181),isObject=__webpack_require__(54),setBindData=__webpack_require__(145),slice=__webpack_require__(170),arrayRef=[],push=arrayRef.push;module.exports=baseBind},function(module,exports,__webpack_require__){function baseCreateWrapper(bindData){function bound(){var thisBinding=isBind?thisArg:this;if(partialArgs){var args=slice(partialArgs);push.apply(args,arguments)}if((partialRightArgs||isCurry)&&(args||(args=slice(arguments)),partialRightArgs&&push.apply(args,partialRightArgs),isCurry&&args.length<arity))return bitmask|=16,baseCreateWrapper([func,isCurryBound?bitmask:-4&bitmask,args,null,thisArg,arity]);if(args||(args=arguments),isBindKey&&(func=thisBinding[key]),this instanceof bound){thisBinding=baseCreate(func.prototype);var result=func.apply(thisBinding,args);return isObject(result)?result:thisBinding}return func.apply(thisBinding,args)}var func=bindData[0],bitmask=bindData[1],partialArgs=bindData[2],partialRightArgs=bindData[3],thisArg=bindData[4],arity=bindData[5],isBind=1&bitmask,isBindKey=2&bitmask,isCurry=4&bitmask,isCurryBound=8&bitmask,key=func;return setBindData(bound,bindData),bound}var baseCreate=__webpack_require__(182),isObject=__webpack_require__(54),setBindData=__webpack_require__(145),slice=__webpack_require__(170),arrayRef=[],push=arrayRef.push;module.exports=baseCreateWrapper},function(module,exports,__webpack_require__){var __WEBPACK_AMD_DEFINE_ARRAY__,__WEBPACK_AMD_DEFINE_RESULT__;__WEBPACK_AMD_DEFINE_ARRAY__=[__webpack_require__(156),__webpack_require__(157),__webpack_require__(164)],__WEBPACK_AMD_DEFINE_RESULT__=function(isNative,isObject,noop){function baseCreate(prototype,properties){return isObject(prototype)?nativeCreate(prototype):{}}var nativeCreate=isNative(nativeCreate=Object.create)&&nativeCreate;return nativeCreate||(baseCreate=function(){function Object(){}return function(prototype){if(isObject(prototype)){Object.prototype=prototype;var result=new Object;Object.prototype=null}return result||window.Object()}}()),baseCreate}.apply(exports,__WEBPACK_AMD_DEFINE_ARRAY__),!(void 0!==__WEBPACK_AMD_DEFINE_RESULT__&&(module.exports=__WEBPACK_AMD_DEFINE_RESULT__))},function(module,exports,__webpack_require__){(function(global){function baseCreate(prototype,properties){return isObject(prototype)?nativeCreate(prototype):{}}var isNative=__webpack_require__(185),isObject=__webpack_require__(54),nativeCreate=(__webpack_require__(186),isNative(nativeCreate=Object.create)&&nativeCreate);nativeCreate||(baseCreate=function(){function Object(){}return function(prototype){if(isObject(prototype)){Object.prototype=prototype;var result=new Object;Object.prototype=null}return result||global.Object()}}()),module.exports=baseCreate}).call(exports,function(){return this}())},function(module,exports,__webpack_require__){(function(global){function baseCreate(prototype,properties){return isObject(prototype)?nativeCreate(prototype):{}}var isNative=__webpack_require__(183),isObject=__webpack_require__(54),nativeCreate=(__webpack_require__(184),isNative(nativeCreate=Object.create)&&nativeCreate);nativeCreate||(baseCreate=function(){function Object(){}return function(prototype){if(isObject(prototype)){Object.prototype=prototype;var result=new Object;Object.prototype=null}return result||global.Object()}}()),module.exports=baseCreate}).call(exports,function(){return this}())},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){function noop(){}module.exports=noop},function(module,exports,__webpack_require__){function isNative(value){return"function"==typeof value&&reNative.test(value)}var objectProto=Object.prototype,toString=objectProto.toString,reNative=RegExp("^"+String(toString).replace(/[.*+?^${}()|[\]\\]/g,"\\$&").replace(/toString| for [^\]]+/g,".*?")+"$");module.exports=isNative},function(module,exports,__webpack_require__){function noop(){}module.exports=noop}])});