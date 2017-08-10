Object.defineProperties(Object.prototype, {
    pWhile: {
        value: function (fn) {
            const arg = this;
            
            function next () {
                new Promise(function (resolve, reject) {
                    fn(arg, resolve, reject);
                }).then(function (c) {
                    if (c) {
                        next();
                    }
                }, function (err) {
                    console.log(err);
                });
            }
            
            next();
        },
        enumerable: false
    } 
});

Array.prototype.pForEach = function (fn) {
    var index = 0;
    const array = this;
    
    function next () {
        if (index < array.length) {
            fn(array[index++], index).then(function (c) {
                if (c) {
                    next();
                }
            });
        }
    }

    next();
};

