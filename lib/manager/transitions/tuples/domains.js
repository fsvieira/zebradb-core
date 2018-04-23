
const Ids = require("../../../zvs/ids");
const utils = require("../../../utils");


/**
 * Compares two sorted arrays to check if they 
 * are equal.
 */
function isEqual (a, b) {
    if (a.length === b.length) {
        for (let i=0; i<a.length; i++) {
            if (a[i] !== b[i]) {
                return false;
            }
        }

        return true;
    }

    return false;
}

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
                else {
                    this.deterministic(states[0])
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

    clean () {
        const tos = [this.start];
        const states = [this.start];

        while (tos.length) {
            const state = tos.pop();
            const symbols = this.transitions[state];

            const domains = {};
            let v;
    
            for (let symbol in symbols) {
                if (symbols.hasOwnProperty(symbol)) {
                   const stos = symbols[symbol];

                    for (let i=0; i<stos.length; i++) {
                        const to = stos[i];
                        if (!states.includes(to)) {
                            tos.push(to);
                            states.push(to);
                        }
                    }
                }
            }
        }

        // delete all states that are not on states,
        for (let s in this.transitions) {
            if (!states.includes(+s)) {
                delete this.transitions[s];
                delete this.states[s];

                const i = this.finals.indexOf(+s);
                if (i >= 0) {
                    this.finals.splice(i, 1);
                }
            }
        }
    }

    minimizeDFA () {
        // https://en.wikipedia.org/wiki/DFA_minimization
        
        // init,
        const states = Object.keys(this.states).map(v => +v).sort(); 
        const p = [states.filter(s => !this.finals.includes(s)).sort(), this.finals.slice()];
        const w = [p[1]];
        const symbols = Object.keys(this.symbolsTable);

        while (w.length) {
            const a = w.pop();

            for (let s=0; s<symbols.length; s++) {
                const c = symbols[s];

                // let X be the set of states for which a transition on c leads to a state in A
                const x = states.filter(s => {
                    const symbols = this.transitions[s];
                    if (symbols) {
                        const tos = symbols[c];
                        if (tos) {
                            return a.includes(tos[0]);
                        }
                    }

                    return false;
                });

                // for each set Y in P for which X ∩ Y is nonempty and Y \ X is nonempty do
                for (let pi=0; pi<p.length; pi++) {
                    // replace Y in P by the two sets X ∩ Y and Y \ X
                    const y = p[pi];
                    const xny = y.filter(s => x.includes(s));
                    const yex = y.filter(s => !x.includes(s));
                
                    if (xny.length > 0 && yex.length > 0) {
                        p.splice(pi, 1, xny, yex);

                        // if Y is in W
                        const index = w.findIndex(x => isEqual(x, y));
                        if (index !== -1) {
                            // replace Y in W by the same two sets
                            w.splice(index, 1, xny, yex);
                        }
                        else {
                            // if |X ∩ Y| <= |Y \ X|
                            if (xny.length <= yex.length) {
                                // add X ∩ Y to W
                                w.push(xny);
                            }
                            else {
                                // add Y \ X to W 
                                w.push(yex);
                            }
                        }
                    }
                }
            }
        }


        const statesTable = {};
        const transitions = {};
        const f = [];

        for (let i=0; i<p.length; i++) {
            const states = p[i];
            const newState = this.getStateJoinID(states);
            f.push(newState);

            for (let j=0; j<states.length; j++) {
                const s = states[j];
                statesTable[s] = newState;
            }
        }

        for (let i=0; i<states.length; i++) {
            const state = states[i];
            const ts = this.transitions[state];
            const from = statesTable[state];

            if (ts) {
                for (let c in ts) {
                    const tos = ts[c];
                    if (tos) {
                        const to = statesTable[tos[0]];
                        const fs = transitions[from] = transitions[from] || {};

                        fs[c] = [to];
                    }
                }
            }
        }

        console.log(JSON.stringify(transitions));
        this.transitions = transitions;
        this.finals = this.finals.filter(s => f.includes(s));

        this.toDot();

    }

    minimize () {
        this.deterministic();
        this.clean();
        this.toDot();

        this.minimizeDFA();
    }

    domain () {
        this.minimize();
        const ds = this._domain();
        return ds;
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

                values.push(value);
                v = variable;
            }
        }

        const results = [];

        for (let to in domains) {
            const vs = this._domain(to);

            if (vs.length > 0) {
                for (let i=0; i<vs.length; i++) {
                    const d = {...vs[i]};

                    d[v] = domains[to];
                    results.push(d);
                }
            }
            else {
                const d = {};
                d[v] = domains[to];
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
                const symbolStr = (this.symbolsTable[symbolID].value.type === 'unify'?"+":"") + symbolID;
                
                for (let t=0; t<tos.length; t++) {
                    const to = tos[t];
                    table += "\t" + from + " -> " + to + ' [label = "' + symbolStr + '"]\n';
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

                for (let v=0; v<variables.length; v++) {
                    const id = variables[v];
                    const dataId = zvs.branches.getDataId(branchId, id);

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
