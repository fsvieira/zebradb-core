const terms = (e, genVariable, variables) => {
    switch(e.type) {
        case 'constant': 
            return {c: e.data};

        case 'variable': { 
            const v = e.data || genVariable();

            let vdata = variables[v];
            if (!vdata) {
                vdata = variables[v] = {v};
            }

            if (e.domain) {
                vdata.d = vdata.d?
                    vdata.filter(c => e.domain.includes(c.c)):
                    e.domain.map(c => terms(c, genVariable, variables))
                ;

                if (vdata.d.length === 0) {
                    throw new Error("Definition has domains that cancel each other.");
                }
            }

            if (e.except) {
                vdata.e = (vdata.e || []).concat(e.except?.map(e => terms(e, genVariable, variables)));
            }

            return vdata;
        }

        case 'tuple': {
            let body;
            if (e.body && e.body.length) {
                body = ts(e.body, genVariable, variables);
            }

            return {t: ts(e.data, genVariable, variables), body}
        }
    }
}

const ts = (tupleData, genVariable, variables={}) => tupleData
    .map(e => terms(e, genVariable, variables));

function prepare (tuple) {

    let v = 1;
    const genVariable = () => '_v' + v++;

    const t = terms(tuple, genVariable, {});

    return t;
}

module.exports = prepare;
