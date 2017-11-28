const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");
const Events = require("../events");

const {
    include,
    parse,
    check,
    merge,
    negations,
    select,

    // definitions    
    prepareDefinitions,
    checkDefinitions,
    multiplyDefinitions,

    // query
    prepareQuery,
    checkDepth,
    updateQuery,
    filterUncheckedNegations,
    filterUncheckedTuples,
    
    // Unify
    matchTuples,
    copyDefinitions
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
                    process: checkDefinitions(false),
                    to: ['multiplyDefinitions']
                },
                multiplyDefinitions: {
                    process: multiplyDefinitions,
                    to: ['checkMultiplyDefinitions']
                },
                checkMultiplyDefinitions: {
                    process: checkDefinitions(true),
                    to: ['prepareQuery']
                },
                prepareQuery: {
                    process: prepareQuery,
                    to: ['checkDepth']
                },
                checkDepth: {
                    process: checkDepth,
                    to: ['updateQuery']
                },
                updateQuery: {
                    process: updateQuery,
                    to: ['filterUncheckedNegations']
                },
                filterUncheckedNegations: {
                    process: filterUncheckedNegations,
                    to: ['filterUncheckedTuples']
                },
                filterUncheckedTuples: {
                    process: filterUncheckedTuples,
                    to: ['matchTuples']
                },
                matchTuples: {
                    process: matchTuples,
                    to: ['success', 'copyDefinitions', 'negations'],
                    dispatch: function (value) {
                        if (value.negations) {
                            return 'negations';
                        }
                        else if (value.tuples.length === 0) {
                            return 'success';
                        }

                        return 'copyDefinitions';
                    }
                },
                copyDefinitions: {
                    process: copyDefinitions,
                    to: ['check']
                },
                check: {
                    process: check,
                    to: ['select']
                },
                /*
                    TODO: eval negations after unify, this can reduce 
                    the number of results to merge phase.
                */
                negations: {
                    process: negations,
                    to: ['copyDefinitions', 'success'],
                    dispatch: function (value) {
                        if (value.tuples.length === 0) {
                            return 'success';
                        }
                        
                        return 'copyDefinitions';
                    }
                },
                select: {
                    process: select,
                    to: ['merge']
                },
                merge: {
                    process: merge,
                    to: ['checkDepth']
                },
                /*
                    TODO: eval negations after merge, this can reduce the number 
                    of results for the next phase.
                    If we loop the merge phase we can use the negation after check 
                    and therefor have only one negation phase.
                */
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
            ordered: ['files', 'prepareDefinitions', 'checkDefinitions'],
            start: 'texts',
            context: {
                zvs: this.zvs,
                events,
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

