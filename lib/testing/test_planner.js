const should = require("should");

const Kanban = require("../manager/kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");
const utils = require("../utils");

const {
    parse,
    definitions,
    plan,
    check,
    negations,
    select
} = require("../manager/transitions/index");

function trim (s) {
    return s.replace(/\n+/g, ' ')
            .replace(/\t+/g, ' ')
            .replace(/ +/g, ' ')
            .trim();
}

function testPlanner (code, result, options) {
    options = options || {};

    return function () {

        if (options.timeout) {
           this.timeout(options.timeout);
        }
    
        return new Promise(function (topResolve, topReject) {
            const events = new Events();
            const zvs = new ZVS(events);

            const queryId = zvs.data.global("query");

            // events.on("halt", topResolve);
            const neg = negations(zvs, events);

            const pipeline = {
                transitions: {
                    texts: {
                        process: parse,
                        to: ['tuples']
                    },
                    tuples: {
                        process: definitions(zvs, events),
                        to: ['queries']
                    },
                    queries: {
                        process: plan(zvs),
                        to: ['success', 'check', 'negations'],
                        dispatch: function (value) {
                            if (value.negations) {
                                return 'negations';
                            }
                            else if (value.tuples.length === 0) {
                                return 'success';
                            }
    
                            return 'check';
                        }
                    },
                    check: {
                        process: check(zvs, neg, events),
                        to: ['select']
                    },
                    negations: {
                        process: neg,
                        to: ['check', 'success'],
                        dispatch: function (value) {
                            if (value.tuples.length === 0) {
                                return 'success';
                            }
                            
                            return 'check';
                        }
                    },
                    select: {
                        process: select(zvs),
                        to: ['result']
                    },
                    result: {
                        process: (value) => {
                            return new Promise(function (resolve, reject) {
                                try {
                                    const plan = value.map(branches => {
                                        // For each array of tuples there should be only one
                                        // tupleId and parentBranchId
                                        return "{" + 
                                            branches.map(
                                                branchId => utils.toString(zvs.getObject(branchId, queryId), true)
                                            ).join(";\n") +
                                        "}";

                                    }).join("\n");
                                    
                                    should(trim(plan)).eql(trim(result));
                                    topResolve();
                                    
                                    resolve({});
                                }
                                catch (e) {
                                    topReject(e);
                                }
                            });
                        }
                    }
                },
                ordered: ['tuples'],
                start: 'texts'
            };
    
            const kanban = new Kanban(pipeline, events);
            
            kanban.add({value: code});
        });
    };
}


module.exports = testPlanner;