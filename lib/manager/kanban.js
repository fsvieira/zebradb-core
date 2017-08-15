const Events = require("../events");

function getStates(transitions) {
    var states = [];

    for (var from in transitions) {
        if (states.indexOf(from) === -1) {
            states.push(from);
        }

        if (transitions[from].to) {
            for (var j=0; j<transitions[from].to.length; j++) {
                const to = transitions[from].to[j];
                if (states.indexOf(to) === -1) {
                    states.push(to);
                }
            }
        }
    }

    return states;
}


function getPaths(states, state) {
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

function getOrderedPaths(transitions, ordered) {
    const states = {};

    getStates(transitions).forEach(function(state) {
        var tos;
        if (transitions[state]) {
            tos = transitions[state].to;
        }

        states[state] = {
            ordered: ordered.indexOf(state) !== -1,
            tos: tos || []
        };
    });

    for (var state in states) {
        states[state].paths = getPaths(states, state).filter(function(s) {
            return s !== state && ordered.indexOf(s) !== -1;
        });

        states[state].keepOrder = states[state].paths.length > 0;

    }

    return states;
}

function processResponse(self, o, states, getState) {
    return function({
        value,
        values,
        trackId
    }) {
        
        if (trackId !== undefined) {
            o.trackIds = o.trackIds || [];
            if (o.trackIds.indexOf(trackId) === -1) {
                o.trackIds.push(trackId);
                // registers id,
                self.track([trackId], 1);
            }
        }

        if (values) {
            o.value = values.map(function(v) {
                return {
                    state: getState(v),
                    trackIds: o.trackIds,
                    value: v
                };
            });

            o.state = '_expand';

            o.value.forEach(function (v) {
                if (!self.stateAttributes[v.state].ordered) {
                    states[v.state].push(v);
                }
            });

            self.track(o.trackIds, values.length);
        }
        else if (value) {
            const state = getState(value);
            o.value = value;
            o.state = state;

            if (!self.stateAttributes[state].ordered) {
                states[state].push(o);
            }

            self.track(o.trackIds, 1);
        }
        else {
            o.state = '_delete';
        }

        self.track(o.trackIds, -1);

        o.wait = false;

        self.cycle();

        self.halt(-1);
    };
}

class Kanban {

    constructor({
        transitions,
        ordered,
        start
    }, events) {
        this.start = start;
        this.states = {};
        this.stateAttributes = getOrderedPaths(transitions, ordered);
        const states = getStates(transitions);

        this.transitions = transitions;
        this.running = false;

        this.ordered = ordered;
        this.order = [];

        this.actives = 0;

        this.events = events || new Events();
        this.tracking = {};
        
        const self = this;
        
        for (var i = 0; i < states.length; i++) {
            const state = states[i];
            const attr = this.stateAttributes[state];
            this.states[states[i]] = [];
            
            if (!attr.keepOrder && !attr.ordered) {
                this.events.on("add-" + state, function (value) {
                    self.halt(1);
                    processResponse(self, {}, self.states, function () {
                        return state;
                    })(value);
                });
            }
        }
    }

    halt(v) {
        this.actives += v || 0;

        if (!this.hasWork() && this.actives === 0) {
            this.events.trigger('halt');
            return true;
        }

        return false;
    }

    track (ids, active) {
        if (ids !== undefined) {
            for (var i = 0; i < ids.length; i++) {
                const id = ids[i];

                const actives = this.tracking[id] = (this.tracking[id] || 0) + active;

                this.events.trigger('track', {
                    id,
                    actives
                });

                if (this.tracking[id] === 0) {
                    delete this.tracking[id];
                }
            }
        }
    }

    add (value) {
        const start = this.start;
        const o = {
            state: start,
            value
        };

        if (this.stateAttributes[this.start].keepOrder) {
            this.order.push(o);
        }
        
        this.halt(1);
        processResponse(this, o, this.states, function () {
            return start;
        })(value);
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

    cycle() {
        if (!this.running) {
            this.running = true;
            const states = this.states;

            while (this.hasWork()) {
                for (var s in states) {
                    if (states[s].length === 0) {
                        continue;
                    }

                    const transition = this.transitions[s];
                    if (transition) {
                        const o = states[s].shift();
                        // const state = transition.next(o.value);
                        const v = transition.process(o.value);

                        this.halt(1);
                        v.then(
                            processResponse(
                                this,
                                o,
                                states,
                                transition.dispatch || function () {
                                    return transition.to[0];
                                }
                            ), 
                            function(err) {
                                console.log(err);
                            }
                        );
                    }
                }

                // check ordered states,
                for (; this.order.length;) {
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
                            states[first.state].push(first);
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
