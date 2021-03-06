var daggy = require('daggy'),
    Option = require('fantasy-options'),
    Store = require('fantasy-stores'),
    Lens = daggy.tagged('run'),
    PartialLens = daggy.tagged('run');

function identity(a) {
    return a;
}
function compose(f, g) {
    return function(a) {
        return f(g(a));
    };
}

function thisAndThen(b) {
    return b.compose(this);
}

// Not you could implement a bilby.js style of property.
function isString(a) {
    return typeof a === 'string';
}
function isNumber(a) {
    return typeof a === 'number';
}
function isNotNaN(a) {
    return !isNaN(a);
}
function isEmpty(a) {
    return !/\S/.test(a);
}
function fold(a, v, f) {
    var rec = function rec(v, index) {
        return (index >= a.length) ?
            v :
            rec(f(v, a[index]), ++index);
    };
    return rec(v, 0);
}

// Methods
Lens.id = function() {
    return Lens(function(target) {
        return Store(
            identity,
            function() {
                return target;
            }
        );
    });
};
Lens.prototype.compose = function(b) {
    var a = this;
    return Lens(function(target) {
        var c = b.run(target),
            d = a.run(c.get());
        return Store(
            compose(c.set, d.set),
            d.get
        );
    });
};
Lens.prototype.andThen = thisAndThen;
Lens.prototype.toPartial = function() {
    var self = this;
    return PartialLens(function(target) {
        return Option.Some(self.run(target));
    });
};
Lens.objectLens = function(property) {
    return Lens(function(o) {
        return Store(
            function(s) {
                var r = {},
                    k;
                for(k in o) {
                    r[k] = o[k];
                }
                r[property] = s;
                return r;
            },
            function() {
                return o[property];
            }
        );
    });
};
Lens.arrayLens = function(index) {
    return Lens(function(a) {
        return Store(
            function(s) {
                var r = a.concat();
                r[index] = s;
                return r;
            },
            function() {
                return a[index];
            }
        );
    });
};
Lens.parse = function(s) {
    return fold(s.split('.'), Lens.id(), function(a, b) {
        var access = fold(b.split('['), Lens.id(), function(a, b) {
            var n = parseInt(b, 10);
            return a.andThen(
                (isNumber(n) && isNotNaN(n)) ?
                Lens.arrayLens(n) :
                   (isString(b) && isEmpty(b)) ?
                   Lens.id() :
                   Lens.objectLens(b)
            );
        });

        return a.andThen(access);
    });
};

PartialLens.id = function() {
    return PartialLens(function(target) {
        return Option.Some(Lens.id().run(target));
    });
};
PartialLens.prototype.compose = function(b) {
    var a = this;
    return PartialLens(function(target) {
        return b.run(target).chain(function(c) {
            return a.run(c.get()).map(function(d) {
                return Store(
                    compose(c.set, d.set),
                    d.get
                );
            });
        });
    });
};
PartialLens.prototype.andThen = thisAndThen;
PartialLens.objectLens = function(property) {
    var totalLens = Lens.objectLens(property);
    return PartialLens(function(target) {
        return property in target ? Option.Some(totalLens.run(target)) : Option.None;
    });
};
PartialLens.arrayLens = function(index) {
    var totalLens = Lens.arrayLens(index);
    return PartialLens(function(target) {
        return index > 0 && index < target.length ? Option.Some(totalLens.run(target)) : Option.None;
    });
};

// Export
if(typeof module != 'undefined') {
    exports.Lens = Lens;
    exports.PartialLens = PartialLens;
}
