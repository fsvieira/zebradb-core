const {parse} = require('../parsing');
const { v4 } = require('uuid');
const FSA = require("fsalib");

const {SHA256} = require("sha2");

class DB {

    constructor () {
        this.indexes = new Map();
        this.tuples = new Map();

        this.fsa = new FSA();
        this.ids = [];
    }

    add(definitions) {
        const tuples = parse(definitions).map(t => {
            t.checked = true;
            return t;
        });

        const ids = [];

        for (let i=0; i<tuples.length; i++) {
            const tuple = tuples[i];

            this.ids.push(SHA256(JSON.stringify(tuple)).toString('base64'));

            const id = v4();
            this.tuples.set(id, tuple);

            const end = this.toRegExp(tuple);

            const final = this.fsa.newState();
            
            this.fsa.transition(end, {id}, final);

            this.fsa.setFinal(final);
        }

        this.fsa = this.fsa.minimize();
    }

    get id () {
        this.ids.sort();
        return SHA256(JSON.stringify(this.ids)).toString('base64');
    }

    toRegExp (v, from=this.fsa.getStart()) {
        let to = this.fsa.newState();

        if (v.v) {
            this.fsa.transition(from, 'v', to);
        }
        else if (v.c) {
            this.fsa.transition(from, 'vl', to);
            this.fsa.transition(from, `c:${v.c}`, to);
        }
        else if (v.t) {
            this.fsa.transition(from, `t:${v.t.length}`, to);

            for (let i=0; i<v.t.length; i++) {
                const vt = v.t[i];
                to = this.toRegExp(vt, to);
            }

            if (this.fsa.getStart() !== from) {
                this.fsa.transition(from, `vl`, to);
            }
        }

        return to;
    }

    search (tuple) {

        const deepSearch = (v, froms) => {
            let next=new Set();

            if (v.t) {
                next = this.fsa.delta(froms, `t:${v.t.length}`);

                for (let i=0; i<v.t.length; i++) {
                    const vt = v.t[i];
                    next = deepSearch(vt, next);
                }

            }
            else if (v.c) {
                next = this.fsa.delta(froms, `c:${v.c}`);
            }
            else if (v.v) {
                next = this.fsa.delta(froms, "vl");
            }

            next = new Set([...next, ...this.fsa.delta(froms, "v")]);

            return next;
        }

        const idStates = [...deepSearch(tuple, [this.fsa.getStart()])];

        const tupleIds = new Set();
        for (let state of idStates) {
            const ids = this.fsa.transitions.get(state);

            for (let [v, to] of ids) {
                if (v.id) {
                    tupleIds.add(v.id);
                }
            }
        }

        const tuples = [];
        for (let id of tupleIds) {
            tuples.push(this.tuples.get(id));
        }

        return tuples;
    }

    _index (v, path="") {
        if (v.t) {
            const r = [];

            for (let i=0; i<v.t.length; i++) {
                const rs = this.index(v.t[i], path===''?i:`${path}|${i}`);

                if (rs) {
                    if (rs instanceof Array) {
                        r.push(...rs);
                    }
                    else {
                        r.push(rs);
                    }
                }
            }

            r.push(`t[${path}]${v.t.length}`, `v[${path}]`);

            return r;
        }
        else if (v.c) {
            return [`c[${path}]${v.c}`, `v[${path}]`];
        }
        else if (v.v) {
            return `v[${path}]`;
        }

    }

    _add (definitions) {
        const tuples = parse(definitions);


        for (let i=0; i<tuples.length; i++) {
            const tuple = tuples[i];
            const id = v4();
            this.tuples.set(id, tuple);

            const indexes = this.index(tuple);
            
            for (let i=0; i<indexes.length; i++) {
                const index = indexes[i];

                let tuples = this.indexes.get(index);

                if (!tuples) {
                    tuples = new Set();
                    this.indexes.set(index, tuples);
                }

                tuples.add(id);
            }
        }
    }

    _search (tuple) {
        const indexes = this.index(tuple, "");

        let result;
        for (let i=0; i<indexes.length; i++) {
            const index = indexes[i];

            const r = this.indexes.get(index);

            if (r) {
                if (result) {
                    result = result.filter(v => r.has(v));
                }
                else {
                    result = [...r];
                }
            }
            
        }

        result = result.map(id => this.tuples.get(id));

        return result;
    }
}

module.exports = DB;
