"use strict";

/*
    TODO:
        we can wrap contracts with a if conditional and put them at the end of
        files.

        The if conditional should be removed by a js preprocessor, on the
        tree-shacking process (removing dead code).

        The variable should be definined has a env variable.
*/

function contractFunc (func, funcName, {pre, post}) {
  const oCall = func;

  return function (...args) {
    if (pre) {
      const r = pre(...args);

      if (r) {
        throw "Function " + funcName + " pre-condition failed, reason: " + r;
      }
    }

    const r = oCall.apply(this, args);

    if (post) {
      const pr = post(r, ...args);

      if (pr) {
        throw "Function " + funcName + " post-condition failed, reason: " + pr;
      }
    }

    return r;
  };
}

function contract (object, funcName, {pre, post}) {
  const oCall = object[funcName];
  object[funcName] = function (...args) {
    if (pre) {
      const r = pre(...args);

      if (r) {
        throw "Function " + funcName + " pre-condition failed, reason: " + r;
      }
    }

    const r = oCall.apply(this, args);

    if (post) {
      const pr = post(r, ...args);

      if (pr) {
        throw "Function " + funcName + " post-condition failed, reason: " + pr;
      }
    }

    return r;
  };
}

/*
    Usage Example:
        contract(this, "funcName", {
            pre: function (x) {
                if (x === 0) {
                    return "First argument can't be 0";
                }
            },
            post: function (result) {
                if (result === 0) {
                    return "result can't be 0";
                }
            }
        })
*/

module.exports = {contract, contractFunc};