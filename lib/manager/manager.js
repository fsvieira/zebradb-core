const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");

const {
    include,
    parse,
    definitions,
    plan,
    check,
    merge,
    negations
} = require("./transitions/index");


class Session {

    constructor ({events = new Events(), readFile, settings}) {

        this.events = events;
        this.zvs = new ZVS(this.events);

        this.zvs.update(
            this.zvs.branches.root, 
            this.zvs.data.global("settings"), 
            {
                data: settings
            }
        );

        const neg = negations(this.zvs, events);

        const pipeline = {
            transitions: {
                files: {
                    process: include(readFile),
                    to: ['texts']
                },
                texts: {
                    process: parse,
                    to: ['tuples', 'files'],
                    dispatch: function (value) {
                        if (value.type === 'include') {
                            return 'files';
                        }
                        
                        return 'tuples';
                    }
                },
                tuples: {
                    process: definitions(this.zvs, this.events),
                    to: ['queries']
                },
                queries: {
                    process: plan(this.zvs),
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
                    process: check(this.zvs, neg, events),
                    to: ['merge']
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
                merge: {
                    process: merge(this.zvs, neg, events),
                    to: ['queries']
                },
                success: {
                    process: function (value) {
                        return new Promise(function (resolve, reject) {
                            events.trigger("success", value.branchId);
                            resolve({});
                        });
                    }
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

