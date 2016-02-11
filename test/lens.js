'use strict';

const λ = require('./lib');
const { laws: { identity:identity
              , retention:retention
              , doubleSet:doubleSet 
              }
      , lens
      , lensʹ
      , read
      , write
      } = require('../fantasy-lenses');
const { singleton } = require('fantasy-helpers');
const { Tuple } = require('fantasy-tuples');

function testLensLaws(f) {
    return lens => λ.check(f(lens)(λ.equals), [λ.objectLike(singleton(k, λ.AnyVal))]);
}

const k = λ.arb(String, λ.goal);
const objectLens = lens(read(k), write(k));
const lensʹʹ = lensʹ(o => Tuple(read(k, o), v => write(k, v, o)));

exports.lensʹ = {
    'identity': testLensLaws(identity)(lensʹʹ),
    'retention': testLensLaws(retention)(lensʹʹ),
    'doubleSet': testLensLaws(doubleSet)(lensʹʹ)
};

exports.lens = {
    'identity': testLensLaws(identity)(objectLens),
    'retention': testLensLaws(retention)(objectLens),
    'doubleSet': testLensLaws(doubleSet)(objectLens)
};
