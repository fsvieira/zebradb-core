function include (req, res) {
    
    const filename = req.args.data;
    const {files} = req.store;
        
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
