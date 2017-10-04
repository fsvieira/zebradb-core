const Ids = require("../zvs/ids");
const utils = require("../utils");

const TYPE_CONSTANT = 0;
const TYPE_VARIABLE = 1;
const TYPE_TUPLE = 2;

const types = {
    'constant': 0,
    'variable': 1,
    'tuple': 2
};

class Match {
    
    constructor (zvs) {
        this.zvs = zvs;
        this.symbols = new Ids();
        this.stateIDs = new Ids();
        this.states = {};
        this.start = this.stateIDs.id([]);
        this.transitions = {};
    }
    
    transition (from, symbol, to) {
        const t = this.transitions[from] = this.transitions[from] || {};
        const s = t[symbol] = t[symbol] || [];
        if (s.indexOf(to) === -1) {
            s.push(to);
        }
    }
    
    getStateJoinID (states) {
        if (states.length > 1) {
            const tuples = [];

            states.forEach(s => {
                const state = this.states[s];

                state.forEach(t => {
                   if (tuples.indexOf(t) === -1) {
                       tuples.push(t);
                   }
                });
                
                tuples.sort();
            });
            
            const stateID = this.stateIDs.id(tuples);
            
            this.states[stateID] = tuples;
            return stateID;
        }
        else {
            return states[0];
        }
    }
    
    add (tupleID, variables) {
        /*
        {Position, Variable, Length} => id,
        {Position, Constant:value, Length} => id,
        {Position, Tuple, Length} => id.
        */
        
        // Create state,
        const stateData = [tupleID];
        const stateID = this.stateIDs.id(stateData);
        this.states[stateID] = stateData;
        
        const tuple = this.zvs.getObject(this.zvs.branches.root, tupleID);
        
        // Start transition,
        this.transition(
            this.start, 
            this.symbols.id({
                type: TYPE_TUPLE,
                length: tuple.data.length
            }),
            stateID
        );
        
        var value;
        for (var i=0; i<tuple.data.length; i++) {
                        
            const v = tuple.data[i];
            value = undefined;            
            
            if (v.type === 'variable') {
                variables[tuple.data.length] = variables[tuple.data.length] || {};
                const s = variables[tuple.data.length][i] = variables[tuple.data.length][i] || {
                    variables: [],
                    symbols: []
                };
                
                s.variables.push(stateID);
            }
            else if (v.type === 'constant') {
                value = v.data;
            }
            else if (v.type === 'tuple') {
                value = v.data.length;
            }

            const symbol = this.symbols.id({
                position: i,
                type: types[v.type],
                value,
                length: tuple.data.length
            });
            
            variables[tuple.data.length] = variables[tuple.data.length] || {};
            const s = variables[tuple.data.length][i] = variables[tuple.data.length][i] || {
                variables: [],
                symbols: []
            };

            if (s.symbols.indexOf(symbol) === -1) {
                s.symbols.push(symbol);
            }
            
            variables[tuple.data.length][i].symbols.push(symbol);
            this.transition(this.start, symbol, stateID);
            this.transition(stateID, symbol, stateID);
        }
    }
    
    addTuples (tuples) {
        const variables = {};
        tuples.forEach(t => {
           this.add(t, variables);
        });
        
        // Create symbol variable transitions,
        for (var variable in variables) {
            const positions = variables[variable];
            for (var position in positions) {
                const vs = positions[position];
                
                if (vs.variables.length > 0 && vs.symbols.length > 0) {
                    vs.variables.forEach(state => {
                        vs.symbols.forEach(symbol => {
                           this.transition(this.start, symbol, state);
                           this.transition(state, symbol, state);
                        });
                    });
                }
            }
        }
        
        // mk automata determinitic.
        this.deterministic();
        
        // set tos states to to.
        for (var from in this.transitions) {
            const symbols = this.transitions[from];
            for (var symbol in symbols) {
                symbols[symbol] = symbols[symbol][0];
            }
        }
        
        // TODO: clean up unused states,
    }
 
    deterministic (stateID) {
        stateID = stateID || this.start;
        
        const symbols = this.transitions[stateID];
        
        if (!symbols) {
            return;
        }
        
        for (var symbol in symbols) {
            const states = symbols[symbol];
            
            if (states.length > 1) {
                const joinID = this.getStateJoinID(states);

                if (!this.transitions[joinID]) {
                    states.forEach(n => {
                        const symbols = this.transitions[n];
                        if (symbols) {
                            for (var symbol in symbols) {
                                const tos = symbols[symbol];
                                tos.forEach(t => {
                                    this.transition(joinID, symbol, t);
                                });
                            }
                        }
                    });
                }
                
                symbols[symbol] = [joinID];
                this.deterministic(joinID);
            }
        }
    }

    getState (from, value) {
        const symbol = this.symbols.id(value);
        
        if (symbol) {
            const to = this.transitions[from][symbol];
            if (to === undefined && value.value !== undefined && value.position !== undefined) {
               // If is a value then try variable.
               const symbol = this.symbols.id({
                   position: value.position,
                   type: TYPE_VARIABLE,
                   value: undefined,
                   length: value.length
               });
               
               return this.transitions[from][symbol];
            }
            
            return to;
        }
    }

    match (branchId, tupleID) {
        // TODO: Probably need a branch or something, 
        const tuple = this.zvs.getData(branchId, tupleID);
        const tupleData = this.zvs.getData(branchId, tuple.data);
        
        const length = tupleData.length;
        
        var from = this.getState(this.start, {
            type: TYPE_TUPLE,
            length
        });
    
        var value;
        
        if (from !== undefined) {
            for (var i=0; i<length; i++) {
                    
                const id = tupleData[i];
    
                value = undefined;
                const v = this.zvs.getData(branchId, id);
                const type = this.zvs.getData(branchId, v.type);
                const data = this.zvs.getData(branchId, v.data);
                
                if (type === 'constant') {
                    value = data;
                }
                else if (type === 'tuple') {
                    value = data.length;
                }
    
                if (value) {
                    from = this.getState(from, {
                        position: i,
                        type: types[type],
                        value,
                        length
                    });
                }
                
                if (from === undefined) {
                    // There is no matching tuples,
                    return;
                }
            }
        
            return this.states[from];
        }
    }
}

module.exports = Match;

