

/*
    * states:
        - states are defined as lists (kanban),
    
    * transition:
        - a function that changes a value from one state to other state.
    
    * null/undefined state:
        - a value that goes from a state to a non defined state is free.
    
    * order:
        - order values as creation, this means that we need to keep track of values order and their transformations,
*/


function getStates (transitions) {
    var states = [];
    
    for (var from in transitions) {
        if (states.indexOf(from) === -1) {
            states.push(from);
        }
        
        for (var to in transitions[from].to) {
            if (states.indexOf(to) === -1) {
                states.push(to);
            }
        }
    }
    
    return states;
}

class Cycles {
    
    constructor ({transitions, orded, start}) {
        this.start = start;
        this.states = {};
        
        const states = getStates(transitions);
        
        for (var i=0; i<states.length; i++) {
            this.states[states[i]] = [];
        }
        
        this.transitions = transitions;
        this.running = false;
        
        this.orded = orded;
        this.order = [];
    }

    add (value) {
        const o = {state: this.start, value};
        
        this.order.push(o);
        
        this.states[this.start].push(o);
        this.cycle();
    }

    halt () {
        for (var state in this.states) {
            if (this.transitions[state] && this.states[state].length > 0) {
                return false;
            }
        }
        
        if (this.order.length && (this.order[0].state === '_expand' || this.orded.indexOf(this.order[0].state) !== -1)) {
            return false;
        }
        
        console.log(JSON.stringify(this.states, null, '\t'));
        return true;
    }

    cycle () {
        if (!this.running) {
            this.running = true;
            const states = this.states;
            const orded = this.orded;
            
            
            while(!this.halt()) {
                for (var s in states) {
                    if (states[s].length === 0) {
                        continue;    
                    }
                    
                    const transition = this.transitions[s];
                    if (transition) {
                        const o = states[s].shift();
                        const state = transition.next(o.value);
                        const v = transition.to[state](o.value);
                        
                        const self = this;
                        v.then(function ({value, values}) {
                            if (values) {
                                o.state = '_expand';
                                o.value = values.map(function (v) {
                                    return {state, value: v};
                                });

                                if (orded.indexOf(state) === -1) {
                                    o.value.forEach(function (v) {
                                        states[state].push(v);
                                    });
                                }
                                else {
                                    
                                }
                            }
                            else {
                                o.value = value;
                                o.state = state;
                                
                                if (orded.indexOf(state) === -1) {
                                    states[state].push(o);
                                }
                            }
                            
                            self.cycle();
                        });
                    }
                }
                
                // check orded states,
                while (this.order.length && (this.order[0].state === '_expand' || this.orded.indexOf(this.order[0].state) !== -1)) {
                    if (this.order[0].state === '_expand') {
                        this.order.splice(0, 1, ...this.order[0].value);
                    }
                    else {
                        const o = this.order.shift();
                        states[o.state].push(o.value);
                    }
                }
            }

            this.running = false;
        }
    }

}

function readFile (filename) {
    return new Promise(function (resolve, reject) {
        resolve("read content of " + filename);
    });
}

function parse (text) {
    return new Promise(function (resolve, reject) {
        if (text === 'file') {
            resolve([
                {type: 'constant' , data: 'blue'},
                {type: 'include', data: 'filename1'},
                {type: 'constant' , data: 'yellow'}
            ]);
        }
        else {
            resolve([
                {type: 'constant' , data: 'red'},
                {type: 'constant' , data: 'green'}
            ]);
        }
    });
}


const cycles = new Cycles ({
    transitions: {
        files: {
            to: {
                texts: function (filename) {
                    return readFile(filename).then(function (text) {
                        return {value: text};
                    });
                }
            },
            next: function () {return 'texts';}
        },
        texts: {
            to: {
                parsed: function (text) {
                    return parse(text).then(function (results) {
                        return {values: results};
                    });
                }
            },
            next: function () {return 'parsed';}
        },
        parsed: {
            to: {
                tuples: function (value) {
                    return new Promise(function (resolve, reject) {
                        resolve({value: value});
                    });
                },
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
    orded: ['tuples'],
    start: 'texts'
});

cycles.add('file');
