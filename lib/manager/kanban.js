const Events = require("../events");

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


function getPaths (states, state) {
    const visited = [];
    var go = states[state].tos.slice(0);
    
    while (go.length) {
        const s = go.pop();
        if (visited.indexOf(s) === -1) {
            visited.push(s);
            go = go.concat(states[s].tos);
        }
    }
    
    return visited;
}

function getOrderedPaths (transitions, ordered) {
    const states = {};
    
    getStates(transitions).forEach(function (state) {
        const tos = [];
        if (transitions[state]) {
            for (var to in transitions[state].to) {
                tos.push(to);
            }
        }
        
        states[state] = {
            ordered: ordered.indexOf(state) !== -1,
            tos: tos
        };
    });

    for (var state in states) {
        states[state].paths = getPaths(states, state).filter(function (s) {
            return s!== state && ordered.indexOf(s) !== -1;
        });
        
        states[state].keepOrder = states[state].paths.length > 0;
        
    }
    
    return states;
}

class Kanban {
    
    constructor ({transitions, ordered, start}, events) {
        this.start = start;
        this.states = {};
        this.stateAttributes = getOrderedPaths(transitions, ordered);
        const states = getStates(transitions);

        for (var i=0; i<states.length; i++) {
            this.states[states[i]] = [];
        }
        
        this.transitions = transitions;
        this.running = false;
        
        this.ordered = ordered;
        this.order = [];
        
        this.actives = 0;
        
        this.events = events || new Events();
    }

    halt (v) {
        this.actives += v || 0;

        if (!this.hasWork() && this.actives === 0) {
            this.events.trigger('halt');
            return true;
        }
        
        return false;
    }

    add (value) {
        const o = {state: this.start, value};
        
        this.order.push(o);
        
        this.states[this.start].push(o);
        this.cycle();
    }

    hasWork () {
        for (var state in this.states) {
            if (this.transitions[state] && this.states[state].length > 0) {
                return true;
            }
        }
        
        if (this.order.length) {
            const first = this.order[0];
            
            return !first.wait && (first.state === '_expand' || first.state === '_delete' || this.stateAttributes[first.state].ordered);
        }

        return false;
    }

    cycle () {
        if (!this.running) {
            this.running = true;
            const states = this.states;
            
            while(this.hasWork()) {
                for (var s in states) {
                    if (states[s].length === 0) {
                        continue;    
                    }
                    
                    const transition = this.transitions[s];
                    if (transition) {
                        const attr = this.stateAttributes[s];

                        const o = states[s].shift();
                        const value = attr.keepOrder?o.value:o;
                        const state = transition.next(value);
                        const v = transition.to[state](value);
                        
                        const self = this;
                        
                        this.halt(1);
                        v.then(function ({value, values}) {
                            if (attr.keepOrder) {
                                if (values) {
                                    o.state = '_expand';
                                    o.value = values.map(function (v) {
                                        return {state, value: v};
                                    });
    
                                    if (!self.stateAttributes[state].ordered) {
                                        o.value.forEach(function (v) {
                                            states[state].push(v);
                                        });
                                    }
                                }
                                else if (value) {
                                    o.value = value;
                                    o.state = state;
                                    
                                    if (!self.stateAttributes[state].ordered) {
                                        states[state].push(o);
                                    }
                                }
                                else {
                                    o.state = '_delete';
                                }
                                
                                o.wait = false;
                            }
                            else {
                                if (values !== undefined) {
                                    states[state].splice(states[state].length, 0, ...values);
                                }
                                else if (value !== undefined) {
                                    states[state].push(value);
                                }
                            }
                            
                            if (values || value) {
                                self.cycle();
                            }
                            
                            self.halt(-1);
                        }, function (err) {
                            console.log(err);
                        });
                    }
                }
                
                // check ordered states,
                for (;this.order.length;) {
                    const first = this.order[0];
                    const attr = this.stateAttributes[first.state];
                    
                    if (!first.wait && attr && attr.ordered) {
                        if (attr.keepOrder) {
                            first.wait = true;
                            states[first.state].push(first);
                            break;
                        }
                        else {
                            this.order.shift();
                            states[first.state].push(first.value);
                        }
                    }
                    else if (first.state === '_expand') {
                        this.order.splice(0, 1, ...first.value);
                    }
                    else if (first.state === '_delete') {
                        this.order.shift();
                    }
                    else {
                        break;
                    }
                }
            }

            this.running = false;
        }
    }
}

module.exports = Kanban;

