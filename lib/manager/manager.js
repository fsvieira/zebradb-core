const {parse: zparse} = require("../zparser");
const Cycles = require("./cycles");
const ZVS = require("../zvs/zvs");
const prepare = require("../prepare");

function parse (text) {
    return new Promise(function (resolve, reject) {
       resolve({values: zparse(text)});
    });
}

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
                resolve({value:{type: 'query', zid: zvs.data.add(query), data: query}});
            }
            else {
                prefix = 'd$';
                /* TODO: 
                    * consider create two defintions branches one uncked and
                    * the other branch with checked defintions,
                    * this will allow to have automaticly query tuples alredy checked.
                */
                value.check = true;
                const def = prepare.copyWithVars(value, genId);
                def.zid = zvs.data.add(def);
                resolve({value: def});
            }
        });
    };
}

function session (readFile) {
    
    const zvs = new ZVS();
    
    const pipeline = {
        transitions: {
            files: {
                to: {
                    texts: include(readFile)
                },
                next: function () {return 'texts';}
            },
            texts: {
                to: {
                    parsed: parse
                },
                next: function () {return 'parsed';}
            },
            parsed: {
                to: {
                    tuples: prepareTuples(zvs),
                    files: function (value) {
                        return new Promise(function (resolve, reject) {
                            resolve({value: value.data});
                        });
                    }
                },
                next: function (value) {
                    if (value.type === 'include') {
                        return 'files';
                    }
                    else {
                        return 'tuples';
                    }
                }
            }
        },
        ordered: ['files', 'tuples'],
        start: 'texts'
    };



    const cycles = new Cycles (pipeline);
    return cycles;
}

function readFile (files) {
    
    return function (filename) {
        return new Promise(function (resolve, reject) {
            const file = files[filename];
            
            if (file) {
                setTimeout(function () {
                    resolve(file.data);
                }, file.delay || 0);
            }
            else {
                reject("File not found.");
            }
        });
    };
}

session(
    readFile({
        "yellow": {
            data: '(yellow) ?(yellow)',
            delay: 1000
        }
    })
).add('[yellow]');

