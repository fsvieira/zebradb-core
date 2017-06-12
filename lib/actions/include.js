function include (readFile) {
    const files = [];
    
    return function (filename) {
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
}

module.exports = include;
