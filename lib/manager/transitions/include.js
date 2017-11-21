/*function include (readFile) {
    const files = [];
    
    return function ({data:filename}) {
        if (files.indexOf(filename) === -1) {
            files.push(filename);
            return readFile(filename).then(function (text) {
                return {value: text};
            });
        }
        else {
            return Promise.resolve({});
        }
    };
}*/

function _include (req, res) {
    
    const filename = req.args.data;
    
    req.state().then(state => {
        const files = state.files;
        
        if (state.files.indexOf(filename) === -1) {
            files.push(filename);
            return req.context.readFile(filename).then(function (text) {
                res.send({value: text});
            });
        }
        else {
            res.send({});
        }
        
        return state;
    });
}

function include () {
    const files = [];
    
    return function (req, res) {
        req.state = function () {
            return Promise.resolve({files});
        };

        _include(req, res);
    };
}

module.exports = include;
