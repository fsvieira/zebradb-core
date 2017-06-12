const prepare = require("../prepare");

function prepareTuples (zvs) {
    return function (value) {
        return new Promise(function (resolve, reject) {
            var id = 0;
            var prefix;
            function genId () {
                return prefix + id++;
            }

            if (value.type === 'query') {
                prefix = 'q$';
                const query = prepare.copyWithVars(value.data, genId);

                resolve({value: {type: 'query', data: query, zid: zvs.data.add(query)}});
            }
            else {
                prefix = 'd$';

                const def = prepare.copyWithVars(value, genId);
                def.check = true;

                resolve({value: def});
            }
        });
    };
}

module.exports = prepareTuples;
