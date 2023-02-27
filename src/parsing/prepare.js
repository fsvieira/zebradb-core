const terms = (e, genVariable, variables) => {
    switch(e.type) {
        case 'constant': 
            return {c: e.data};

        case 'variable': { 
            const v = e.data || genVariable();

            if (!variables[v]) {
                variables[v] = {
                    v,
                    d: e.domain?.map(c => terms(c, genVariable, variables))
                };
            }

            return variables[v];
        }

        case 'tuple': {
            let body;
            if (e.body && e.body.length) {
                body = ts(e.body, genVariable, variables);
            }

            return {t: ts(e.data, genVariable, variables), body}
        }

        case 'except': {
            const v = genVariable();
            
            if (!variables[v]) {
                variables[v] = {
                    v,
                    e: [terms(e.data, genVariable, variables)]
                };
            }

            return variables[v];
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
