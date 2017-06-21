const prepare = require("../prepare");

function prepareTuples (zvs) {
    var id = 0;
    function genId () {
        return "id$" + id++;
    }

    return function (value) {
        return new Promise(function (resolve, reject) {
            if (value.type === 'query') {
                const query = prepare.copyWithVars(value.data, genId);

                resolve({value: {type: 'query', data: query, zid: zvs.data.add(query)}});
            }
            else {
                const def = prepare.copyWithVars(value, genId);
                def.check = true;

                resolve({value: def});
            }
        });
    };
}

module.exports = prepareTuples;
