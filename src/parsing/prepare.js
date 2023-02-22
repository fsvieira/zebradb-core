const terms = (e, vs, genVariable, variables) => {
    switch(e.type) {
        case 'constant': 
            return {c: e.data};

        case 'variable': { 
            const v = e.data || genVariable();

            if (!vs.includes(v)) {
                vs.push(v);
                variables[v] = {
                    v,
                    d: e.domain?.map(c => terms(c, vs, genVariable, variables))
                };
            }

            return variables[v];
        }

        case 'tuple': { 
            return {t: ts(e, vs, genVariable, variables)}
        }

        case 'except': {
            const v = genVariable();
            
            if (!vs.includes(v)) {
                vs.push(v);

                variables[v] = {
                    v,
                    e: [terms(e.data, vs, genVariable, variables)]
                };
            }

            return variables[v];
        }

        /*
        case 'domain': {
            const v = genVariable();

            return {
                v,
                d: e.data.map(c => terms(c, vs, genVariable, variables))
            }
        }*/
    }
}

const ts = (tuple, vs, genVariable, variables={}) => tuple.data
    .map(e => terms(e, vs, genVariable, variables));

function prepare (tuple) {

    let v = 1;
    const genVariable = () => '_v' + v++;

    const vs = [];

    const t = ts(tuple, vs, genVariable);

    return {t, vs};    
}

module.exports = prepare;
