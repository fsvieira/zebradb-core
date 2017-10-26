const Ids = require("../zvs/ids");

class Sets {

    constructor () {
        this.symbolIDs = new Ids();
        this.setIDs = new Ids();

        this.sets = {};
        this.start = this.setIDs.id([]);
        
        this.sets[this.start] = [];
        
        this.transitions = {};
        
        this.updated = true;
        
        this.idConversion = {
            sets: {},
            symbols: {}
        };
    }
    
    /*
        State Automata methods,
    */
    transition (from, symbol, to) {
        this.updated = false;
        
        const t = this.transitions[from] = this.transitions[from] || {};
        const s = t[symbol] = t[symbol] || [];
        if (s.indexOf(to) === -1) {
            s.push(to);
        }
    }
    
    deterministic (setID) {
        if (!this.updated) {
            const sets = [setID || this.start];
            const done = [];
    
            while (sets.length) {
                const setID = sets.pop();
                const symbols = this.transitions[setID];
                
                done.push(setID);
            
                if (!symbols) {
                    continue;
                }
            
                for (var symbol in symbols) {
                    const symbolSets = symbols[symbol];
                    
                    if (symbolSets.length > 1) {
                        const joinID = this.getSetJoinID(symbolSets);
        
                        if (!this.transitions[joinID]) {
                            symbolSets.forEach(n => {
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

                        if (done.indexOf(joinID) === -1) {
                            // If has not been processed then send 
                            // it to processing list.
                            sets.push(joinID);    
                        }
                        
                    }
                }
            }
        }
        
        this.updated = true;
    }
    
    getSetJoinID (sets) {
        if (sets.length > 1) {
            const joinedSets = [];

            sets.forEach(s => {
                const setID = this.sets[s];

                setID.forEach(st => {
                   if (joinedSets.indexOf(st) === -1) {
                       joinedSets.push(st);
                   }
                });
                
                joinedSets.sort();
            });
            
            const setID = this.setIDs.id(joinedSets);
            
            this.sets[setID] = joinedSets;
            return setID;
        }
        else {
            return sets[0];
        }
    }
    
    /*
        User/internal functions,
    */
    insert (symbolsIDs, setID) {
        if (setID) {
            if (symbolsIDs.length > 0) {
                symbolsIDs.forEach(s => {
                    this.transition(
                        this.start,
                        s,
                        setID
                    );
                    
                    this.transition(
                        setID,
                        s,
                        setID
                    );
                });
            }
        }
    }
    
    getSetsID (symbolID, setID) {
        // make sure transitions are deterministic before sending result.
        this.deterministic();
        
        setID = setID || this.start;
        
        return this.transitions[setID][symbolID];
    }
    
    /*
        User friendly apis.
    */
    getSetID (setRepresentation) {
        const setID = this.setIDs.id(setRepresentation);
        
        this.sets[setID] = [setID];
        this.idConversion.sets[setID] = setRepresentation;
        
        return setID;
    }
    
    getSymbolID (symbolRepresentation) {
        const symbolID = this.symbolIDs.id(symbolRepresentation);
        
        this.idConversion.symbols[symbolID] = symbolRepresentation;
        
        return symbolID;
    }
    
    getSymbol (symbolID) {
        return this.idConversion.symbols[symbolID];
    }
    
    getSets (setID) {
        return this.sets[setID].map(setID => this.idConversion.sets[setID]);
    }
    
    /*
        Returns the actual set objects,
    */
    getSymbolSets (symbolID, setID) {
        const setsID = this.getSetsID(symbolID, setID);
        
        if (setsID) {
            return this.sets[setsID].map(setID => {
                return this.idConversion.sets[setID];
            });
        }
    }
    
    /*
        return all sets,
    */
    getAllSets () {
        this.deterministic();
        
        return Object.keys(this.transitions)
            .filter(
                s => +s !== this.start
            )
            .map(
                s => this.getSets(s)
            );
    }
}

module.exports = Sets;
