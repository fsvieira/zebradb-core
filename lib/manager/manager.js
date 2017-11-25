const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");

const {
    include,
    parse,
    plan,
    check,
    merge,
    negations,
    select,
    checkMultiply,
    checkDefinitions,
    multiplyDefinitions,
    prepareDefinitions,
    prepareQuery
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

        // const neg = negations(this.zvs, events);

        const pipeline = {
            transitions: {
                files: {
                    process: include,
                    to: ['texts']
                },
                texts: {
                    process: parse,
                    to: ['files', 'prepareDefinitions'],
                    dispatch: function (value) {
                        if (value.type === 'include') {
                            return 'files';
                        }

                        return 'prepareDefinitions';
                    }
                },
                prepareDefinitions: {
                    process: prepareDefinitions,
                    to: ['checkDefinitions']
                },
                checkDefinitions: {
                    process: checkDefinitions,
                    to: ['multiplyDefinitions']
                },
                multiplyDefinitions: {
                    process: multiplyDefinitions,
                    to: ['prepareQuery']
                },
                prepareQuery: {
                    process: prepareQuery,
                    to: ['checkMultiply']
                },
                /*
                tuples: {
                    process: definitions,
                    to: ['checkMultiply']
                },*/
                /*multiply: {
                    process: multiply(this.zvs, this.events),
                    to: ['checkMultiply']
                },*/
                checkMultiply: {
                    process: checkMultiply,
                    to: ['queries']
                },
                queries: {
                    process: plan,
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
                    process: check,
                    to: ['select']
                },
                negations: {
                    process: negations,
                    to: ['check', 'success'],
                    dispatch: function (value) {
                        if (value.tuples.length === 0) {
                            return 'success';
                        }
                        
                        return 'check';
                    }
                },
                select: {
                    process: select,
                    to: ['merge']
                },
                merge: {
                    process: merge,
                    to: ['queries']
                },
                success: {
                    process: (req, res) => {
                        const {branchId} = req.args;
                        const {zvs, events} = req.context;
                        const queryBranchId = zvs.getObject(branchId, this.zvs.data.global("queryBranchId")).data;

                        zvs.branches.end({
                            rootBranchId: queryBranchId,
                            branchId, 
                            success: true
                        });

                        events.trigger("success", branchId);
                        res.send({});
                    }
                }
            },
            ordered: ['files', 'prepareDefinitions', 'prepareQuery'],
            start: 'texts',
            context: {
                zvs: this.zvs,
                events,
                negations,
                readFile
            },
            store: {
                files: [],
                definitions: [],
                id: 0
            }
        };

        this.kanban = new Kanban(pipeline, this.events);
    }
    
    add (value) {
        this.kanban.add(value);
    }
}

module.exports = Session;

