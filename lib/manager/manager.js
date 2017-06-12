const Kanban = require("./kanban");
const ZVS = require("../zvs/zvs");


const {
    include,
    parse,
    prepareTuples,
    definitions,
    plan
} = require("../actions/index");




function session (readFile, settings) {
    
    const zvs = new ZVS();

    zvs.update(
        zvs.branches.root, 
        zvs.data.global("settings"), 
        {
            data: settings
        }
    );

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
                    return value.type === 'include'?'files':'tuples';
                }
            },
            tuples: {
                to: {
                    queries: definitions(zvs)
                },
                next: function () {return 'queries';}
            },
            queries: {
                to: {
                    plan: plan(zvs)
                },
                next: function () {return 'plan';}
            }
        },
        ordered: ['files', 'tuples'],
        start: 'texts'
    };



    const kanban = new Kanban(pipeline);
    return kanban;
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

