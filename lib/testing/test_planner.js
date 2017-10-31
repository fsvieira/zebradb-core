const should = require("should");

const Kanban = require("../manager/kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");
const utils = require("../utils");

const {
    parse,
    definitions,
    plan
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

            // events.on("halt", topResolve);

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
                        to: ['result']
                    },
                    result: {
                        process: (value) => {
                            return new Promise(function (resolve, reject) {
                                try {
                                    const plan = value.tuples.map(
                                        t => {
                                            return utils.toString(zvs.getObject(value.branchId, t.tuple), true) + " ** [" +
                                                t.definitions.map(d => utils.toString(zvs.getObject(value.branchId, d), true)).join('\n')
                                            + "]\n";
                                        }
                                    ).join("\n");
                                    
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