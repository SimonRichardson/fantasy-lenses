'use strict';

const { curry, extend, singleton } = require('fantasy-helpers');
const { lens } = require('../lens');

const read = curry((k, o) => o[k]);

const write = curry((k, v, o) => extend(extend({}, o), singleton(k, v)));

const erase = curry((k, o) => {
    const res = extend({}, o);
    delete o[k];
    return res;
});

const partial = k => {
    const a = o => k in o ? Some(o[k]) : None;
    const b = (opt, o) => opt.fold(x => write(k, x, o), () => erase(k, o));
    return lens(a, b);
};

module.exports = { read
                 , write
                 , erase
                 , partial
                 };