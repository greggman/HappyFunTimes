/*
 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of its
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
"use strict";

/**
 * Random functions
 * @module Random
 */
define(function() {

  /**
   * A pseudo random number generator.
   * This can be use to repeat a sequence of semi random numbers.
   * Call reset when you want to start the sequence over.
   *
   * As an example if you wanted to draw random stars in a game
   * you'd have to either make a table of random star positions
   * or you could just do this every frame, no storage needed.
   *
   *     // at init time
   *     var r = new Random.PseudoRandomGenerator();
   *
   *     // at draw time
   *     r.reset();
   *     for (var ii = 0; ii < numStars; ++ii) {
   *        drawStar(r.randomInt(width), r.randomInt(height));
   *     }
   *
   * @constructor
   * @alias PseudoRandomGenerator
   * @memberOf module:Random
   */
  var PseudoRandomGenerator = function() {
    var s_randomSeed = 0;
    var RANDOM_RANGE = Math.pow(2, 32);

    var random = function() {
      return (s_randomSeed =
              (134775813 * s_randomSeed + 1) %
              RANDOM_RANGE) / RANDOM_RANGE;
    };

    /**
     * Generates a pseudo random int between 0 and 2~32
     * @func
     * @returns a pseudo random int between 0 and 2~32
     */
    this.random = random;

    /**
     * Starts the pseudo random sequence over.
     */
    this.reset = function() {
      s_randomSeed = 0;
    };

    /**
     * Generates a pseudo random number between min and max
     * @param {number} min min value
     * @param {number} max max value
     * @returns a pseudo random number between min and max
     */
    this.randomRange = function(min, max) {
      return min + random() * (max - min);
    };

    /**
     * Generates a pseudo random number from 0 to max
     * @param {number} range max value
     * @returns a pseudo random number from 0 to max
     */
    this.randomInt = function(range) {
      return random() * range | 0;
    };
  };

  var def = new PseudoRandomGenerator();

  /**
   * Generates a pseudo random int between 0 and 2~32
   * @func pseudoRandom
   * @memberOf module:Random
   * @returns a pseudo random int between 0 and 2~32
   */

  /**
   * Generates a pseudo random number between min and max
   * @func pseudoRandomRange
   * @memberOf module:Random
   * @param {number} min min value
   * @param {number} max max value
   * @returns a pseudo random number between min and max
   */

  /**
   * Generates a pseudo random number from 0 to max
   * @func pseudoRandomInt
   * @memberOf module:Random
   * @param {number} range max value
   * @returns a pseudo random number from 0 to max
   */

  /**
   * Starts the pseudo random sequence over.
   * @func resetPseudoRandom
   * @memberOf module:Random
   */

  return {
    PseudoRandomGenerator: PseudoRandomGenerator,
    pseudoRandom: def.random,
    pseudoRandomRange: def.randomRange,
    pseudoRandomInt: def.randomInt,
    resetPseudoRandom: def.reset,
  };
});


