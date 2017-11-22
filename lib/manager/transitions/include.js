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

function include (req, res) {
    
    const filename = req.args.data;
    const files = req.store.files;
        
    if (files.indexOf(filename) === -1) {
        files.push(filename);
        return req.context.readFile(filename).then(function (text) {
            res.send({value: text});
        });
    }
    else {
        res.send({});
    }
}


module.exports = include;
