
const Ids = require("../../../zvs/ids");
const utils = require("../../../utils");


class Domains {
    constructor () {
        this.states = {};
        this.transitions = {};
        this.stateIDs = new Ids();
        this.statesCounter = 0;
        const startData = [this.statesCounter++];
        this.start = this.stateIDs.id(startData);
        console.log(this.start);
        this.states[this.start] = startData;
        this.symbols = new Ids();
        this.symbolsTable = {};
        this.finals = [];
    }

    transition (from, symbol, to) {
		const t = this.transitions[from] = this.transitions[from] || {};
		const s = t[symbol] = t[symbol] || [];
		if (!s.includes(to)) {
			s.push(to);
		}
	}

    add (values) {
        values.sort((a, b) => a.variable - b.variable);

        let state = this.start;
        for (let i=0; i<values.length; i++) {
            const value = values[i];

            // variable value or not,
            const isValue = value.value.type === 'value';

            const isValueData = {variable: value.variable, isValue};
            const isValueSymbol = this.symbols.id(isValueData);

            this.symbolsTable[isValueSymbol] = isValueData;

            const isValueToData = [this.statesCounter++];
            const isValueTo = this.stateIDs.id(isValueToData);
            this.states[isValueTo] = isValueToData;

            this.transition(state, isValueSymbol, isValueTo);
            state = isValueTo;

            // variable value,
            const symbol = this.symbols.id(value);
            this.symbolsTable[symbol] = values[i];

            const toData = [this.statesCounter++];
            const to = this.stateIDs.id(toData);
            this.states[to] = toData;

            this.transition(state, symbol, to);
            state = to;
        }
        
        this.finals.push(state);
    }

    deterministic (stateID) {
		stateID = stateID || this.start;

		const symbols = this.transitions[stateID];

		if (!symbols) {
			return;
		}

		for (let symbol in symbols) {
			if (symbols.hasOwnProperty(symbol)) {
				const states = symbols[symbol];

                if (states.length > 1) {
                    const joinID = this.getStateJoinID(states);

					if (!this.transitions[joinID]) {
						for (let i = 0; i < states.length; i++) {
                            const n = states[i];
							const symbols = this.transitions[n];
							this.copySymbolsToState(joinID, symbols);
						}
					}

					symbols[symbol] = [joinID];
					this.deterministic(joinID);
				}
			}
		}
    }

    getStateJoinID (states) {
		if (states.length > 1) {
			const joinStates = [];

			for (let i = 0; i < states.length; i++) {
				const s = states[i];
				const state = this.states[s];

				for (let j = 0; j < state.length; j++) {
					const t = state[j];

					if (!joinStates.includes(t)) {
						joinStates.push(t);
					}
				}

				joinStates.sort();
			}

			const stateID = this.stateIDs.id(joinStates);

            if (!this.finals.includes(stateID)) {
                const r = states.filter(s => this.finals.includes(s));

                if (r.length > 0) {
                    this.finals.push(stateID);
                }
            }

            this.states[stateID] = joinStates;
			return stateID;
		}
		else {
			return states[0];
		}
	}

    copySymbolsToState (joinID, symbols) {
		if (symbols) {
			for (let symbol in symbols) {
				if (symbols.hasOwnProperty(symbol)) {
					const tos = symbols[symbol];

					for (let j = 0; j < tos.length; j++) {
						const t = tos[j];
						this.transition(joinID, symbol, t);
					}
				}
			}
		}
	}

    reverse () {
        const finalState = this.getStateJoinID(this.finals);
        this.transitions = this._reverse(this.start, {}, finalState);
        this.states[finalState] = this.finals;
        this.finals = [this.start];
        this.start = finalState;
    }

    _reverse (from, transitions, finalState, visited=[]) {
        if (!visited.includes(from)) {
            visited.push(from);

            const symbols = this.transitions[from];

            if (this.finals.includes(from)) {
                from = finalState;
            }

            for (let symbol in symbols) {
                if (symbols.hasOwnProperty(symbol)) {
                    const to = symbols[symbol][0];
                    let s = to;
                    if (this.finals.includes(to)) {
                        s = finalState;
                    }
            
                    const values = transitions[s] = transitions[s] || {};
                    const tos = values[symbol] = values[symbol] || [];
                        
                    if (!tos.includes(from)) {
                        tos.push(from);
                    }

                    this._reverse(to, transitions, finalState, visited);
                }
            }
        }

        return transitions;
    }

    minimize () {
        this.deterministic();
        this.reverse();
        this.deterministic();
        this.reverse();
    }

    domain () {
        this.minimize();
        return this._domain();
    }

    _domain (state) {
        state = state || this.start;

        const symbols = this.transitions[state];

        const domains = {};
        let v;

        for (let symbol in symbols) {
            if (symbols.hasOwnProperty(symbol)) {
                const {variable, value} = this.symbolsTable[symbol];

                const to = symbols[symbol][0];
                const values = domains[to] = domains[to] || [];

                if (value) {
                    values.push(value);
                    v = variable;
                }
            }
        }

        const results = [];

        for (let to in domains) {
            const vs = this._domain(to);

            if (vs.length > 0) {
                for (let i=0; i<vs.length; i++) {
                    const d = {...vs[0]};

                    if (v) {
                        d[v] = domains[to];
                    }

                    results.push(d);
                }
            }
            else {
                const d = {};
                if (v) {
                    d[v] = domains[to];
                }

                results.push(d);
            }
        }

        return results;
    }

    toDot() {
        let table = "";

        console.log("Start " + this.start);

        for (let from in this.transitions) {
            const symbols = this.transitions[from];
            for (let symbolID in symbols) {
                const tos = symbols[symbolID];
                for (let t=0; t<tos.length; t++) {
                    const to = tos[t];
                    table += "\t" + from + " -> " + to + ' [label = "' + symbolID + '"]\n';
                }
            }
        }

        const g = 'digraph Domain {\n' +
            '\trankdir=LR;\n' +
            '\tsize="8,5"\n' +
            '\tnode [shape = doublecircle]; '+ this.finals.join(" ") +';\n' +
            '\tnode [shape = circle];\n' +
            table +
        "}";

        console.log(g);
    }
}

/*
    TODO:
        * branches = 1, don't calculate domain, keep branch,
        * domains = 0, keep branches, (no variables)
        * domains === branches, keep branches.
        * domains < branches, generate branches from domains.

        -- Negations:
            * handle negations as a normal variable, except that its not atached to any tuple.
        
        -- Variables:
            1) if a variable contains new variables:
                - convert all new variables to existing variables, if not possible:
                    - convert new varible to min id variable mark it as new.

            2) if a variable is equal to other variables:
                - ex. a = b = c then {a: [b]}, {b: [c]} and {c: []}
                - ex. e=(equal a b) then domain: [{e: [(equal a b)], a: [b], b: []}]

        -- Tuples:
            - Using variables step we can consider tuples as simple values.
*/

function toString (domain, zvs, branchId) {
    const ds = [];
    for (let j=0; j<domain.length; j++) {
        const d = domain[j];
        const dvars = {};

        for (let v in d) {
            const dv = d[v].map(value => zvs.getObject(branchId, value));
            vs = utils.toString(zvs.getObject(branchId, +v));

            // we need to save variable id, so that a variable gets only one value.
            dvars[vs] = utils.toString({type: "domain", data: dv, variable: +v});
        }

        ds.push(dvars);
    }

    console.log(JSON.stringify(ds));
}

function domains (req, res) {
	const { zvs } = req.context;
	const { branches, branchId } = req.args;
    const results = [];

    for (let i=0; i<branches.length; i++) {
        // TODO: we can get varibles when constructing domain and avoid unecessary computations.
        const {branches: bs, variables, tupleId} = branches[i];

        console.log(JSON.stringify(variables));
        
        if (bs.length === 1 || variables.length === 0) {
            // there is no need to extract domains if there is only one branch,
            results.push(bs);
        }
        else {
            // TODO: if we calc variables here we will need to test if there is any variables to compute domain. 
            const s = new Domains();

            for (let b=0; b<bs.length; b++) {
                const vs = [];
                const branchId = bs[b];

                // 1. collect all variables,
                const defer = {};
                for (let v=0; v<variables.length; v++) {
                    const id = variables[v];
                    const valueID = zvs.branches.getDataId(branchId, id);

                    const value = zvs.getData(branchId, id);
                    const valueType = zvs.getData(branchId, value.type);

                    if (valueType === 'variable') {
                        const ds = (defer[id] || [id]).concat(defer[valueID] || [valueID]);
                        const s = [];
                        
                        for (let i=0; i<ds.length; i++) {
                            const di = ds[i];
                            defer[di] = s;

                            if (!s.includes(di)) {
                                s.push(di)
                            }
                        }
                    }
                }

                // all extracted variables are for unifications, has they have been extracted from original
                // variables.
                for (let v in defer) {
                    defer[v] = +defer[v].filter(vf => variables.includes(vf)).sort()[0];
                    if (defer[v] === +v) {
                        delete defer[v];
                    }
                }

                console.log("defer => " + JSON.stringify(defer));
                utils.printQuery(zvs, branchId);

                // TODO: we need to normalize tuples and tuple varibles for generated domains
                for (let v=0; v<variables.length; v++) {
                    const id = variables[v];
                    const dataId = zvs.branches.getDataId(branchId, id);

                    // TODO: normalize how data is encoded on domain, should be a array of objects.
                    if (defer[dataId]) {
                        vs.push({variable: id, value: {type: 'unify', data: defer[dataId]}});
                    }
                    else {
                        vs.push({variable: id, value: {type: 'value', data: dataId}});
                    }
                }
                
                s.add(vs);
            }

            const domain = s.domain();

            console.log("domain => " + JSON.stringify(domain));
            toString(domain, zvs, branchId);

            if (domain.length < bs.length) {
                // convert domains to branches,
                const group = [];

                for (let j=0; j<domain.length; j++) {
                    const d = domain[j];

                    // TODO: bs is the same for all domains, if possible we could only set args for the branches that 
                    // contribute for domain.
                    const b = zvs.branches.getId({
                        parent: branchId,
                        args: bs,
                        action: "domains",
                        domain: j
                    }).branchId;
    
                    zvs.update(b, tupleId, {check: true});

                    for (let v in d) {
                        const dv = [];
                        for (let k=0; k<d[v].length; k++) {
                            const {type, data} = d[v][k];

                            if (type === 'value') {
                                dv.push(zvs.getObject(branchId, data));
                            }
                            /**
                             * TODO: 
                             *  - when variable unifies with other variables or is not set,
                             *  we must check that domain is being constructed properly.
                             * 
                             * - variables can't have values and unify with other variable,
                             * - variables can't unify to more then one variable.
                             */
                            else if (type === 'unify') {
                                if (data !== +v) {
                                    zvs.branches.transform(
                                        b, +v,
                                        data
                                    );
                                }
                            }
                        }

                        if (dv.length > 0) {
                            zvs.branches.transform(
                                b, +v,
                                zvs.data.add({type: "domain", data: dv, variable: +v})
                            );
                        }
                    }

                    group.push(b);
                }

                results.push(group);
            }
            else {
                results.push(bs);
            }
        }
    }

    res.send({value: {branches: results}});
}

module.exports = domains;
