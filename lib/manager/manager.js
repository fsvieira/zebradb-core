const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");

const {
    include,
    parse,
    prepareTuples,
    definitions,
    plan,
    check,
    check2merge,
    merge,
    negations
} = require("../actions/index");


class Session {

    constructor ({events, readFile, settings}) {

        this.events = events || new Events();
        this.zvs = new ZVS(this.events);

        this.zvs.update(
            this.zvs.branches.root, 
            this.zvs.data.global("settings"), 
            {
                data: settings
            }
        );

        const checkFn = check(this.zvs);

        const pipeline = {
            transitions: {
                files: {
                    to: {
                        texts: include(readFile)
                    },
                    next: function () {return 'texts';}
                },
                texts: {
                    to: {
                        parsed: parse
                    },
                    next: function () {return 'parsed';}
                },
                parsed: {
                    to: {
                        tuples: prepareTuples(this.zvs),
                        files: function (value) {
                            return new Promise(function (resolve, reject) {
                                resolve({value: value.data});
                            });
                        }
                    },
                    next: function (value) {
                        return value.type === 'include'?'files':'tuples';
                    }
                },
                tuples: {
                    to: {
                        queries: definitions(this.zvs, this.events)
                    },
                    next: function () {return 'queries';}
                },
                queries: {
                    to: {
                        plan: plan(this.zvs)
                    },
                    next: function () {return 'plan';}
                },
                plan: {
                    to: {
                        success: function (value) {
                            return new Promise(function (resolve, reject) {
                                resolve({value: value.branchId});
                            });
                        },
                        check: checkFn,
                        negations: function (value) {
                            return new Promise(function (resolve, reject) {
                                resolve({value: value});
                            });
                        }
                    },
                    next: function (value) {
                        if (value.negations) {
                            return 'negations';
                        }
                        else if (value.tuples.length === 0) {
                            return 'success';
                        }
                        
                        return 'check';
                    }
                },
                success: {
                    to: {
                        end: (function (events) {
                            return function (branchId) {
                                return new Promise(function (resolve, reject) {
                                    events.trigger("success", branchId);
                                    resolve({});
                                });
                            };
                        })(this.events)
                    },
                    next: function () {return 'end';}
                },
                check: {
                    to: {
                        merge: check2merge(this.zvs)
                    },
                    next: function () {return 'merge';}
                },
                negations: {
                    to: {
                        check: negations(this.zvs, this.events, checkFn),
                        plan: negations(this.zvs, this.events, checkFn)
                    },
                    next: function (value) {
                        if (value.tuples.length === 0) {
                            return 'plan';
                        }
                        
                        return 'check';
                    }
                },
                merge: {
                    to: {
                        queries: merge(this.zvs)
                    },
                    next: function () {return 'queries';}
                }
            },
            ordered: ['files', 'tuples'],
            start: 'texts'
        };

        this.kanban = new Kanban(pipeline, this.events);
    }
    
    add (value) {
        this.kanban.add(value);
    }
}

module.exports = Session;

