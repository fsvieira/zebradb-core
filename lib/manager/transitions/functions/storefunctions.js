const Tranformation = require ("../../../transformation/transformation");

function storeFunctions (req, res) {
    const {functions} = req.store;
    const funcDescription = req.args;
    const func = new Tranformation(funcDescription, functions);

    if (!func.validate()) {
        /* TODO:
            - send error, 
            - abort everything
        */
    }

    functions[funcDescription.name] = func;

    res.send({});
}

module.exports = storeFunctions;