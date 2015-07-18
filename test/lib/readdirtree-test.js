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

var assert      = require('assert');
var path        = require('path');
var should      = require('should');
var readdirtree = require('../../lib/readdirtree');

describe('readdirtree', function() {

  it('should ignore files', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['foo.jpg']);
    ignoreFn("foo.jpg", ".", false).should.be.false();
    ignoreFn("sfoo.jpg", ".", false).should.be.true();
    ignoreFn("foo.jpgs", ".", false).should.be.true();
    ignoreFn("foodjpg", ".", false).should.be.true();
    ignoreFn("bar/foo.jpg", ".", false).should.be.false();
    ignoreFn("bar/moo/foo.jpg", ".", false).should.be.false();
    ignoreFn("bar/moo/foo.jpg", ".", false).should.be.false();
  });

  it('should ignore files with extensions', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['*.jpg']);
    ignoreFn("foo.jpg", ".", false).should.be.false();
    ignoreFn("foodjpg", ".", false).should.be.true();
    ignoreFn("bar/bar.jpg", ".", false).should.be.false();
    ignoreFn("bar/moo/moo.jpg", ".", false).should.be.false();
    ignoreFn("bar/moo/lah.jpg", ".", false).should.be.false();
  });

  it('should ignore files with prefix', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['abc*']);
    ignoreFn("abc", ".", false).should.be.false();
    ignoreFn("abcdef", ".", false).should.be.false();
    ignoreFn("foo/abc", ".", false).should.be.false();
    ignoreFn("foo/abcdef", ".", false).should.be.false();
    ignoreFn("abc/foo", ".", false).should.be.false();
    ignoreFn("abcdef/foo", ".", false).should.be.false();
  });

  it('should ignore files questions', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['a?c']);
    ignoreFn("abc", ".", false).should.be.false();
    ignoreFn("adc", ".", false).should.be.false();
    ignoreFn("ac", ".", false).should.be.true();
  });

  it('should ignore only root based', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['/foo']);
    ignoreFn("foo", ".", false).should.be.false();
    ignoreFn("foo/bar", ".", false).should.be.false();
    ignoreFn("bar/foo", ".", false).should.be.true();
  });

  it('should ignore only dir', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['foo/']);
    ignoreFn("foo", ".", true).should.be.false();
    ignoreFn("foo", ".", false).should.be.true();
    ignoreFn("foo/abc", ".", false).should.be.false();
    ignoreFn("bar/foo", ".", true).should.be.false();
    ignoreFn("bar/foo", ".", false).should.be.true();
  });

  it('should not ignore files', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!foo.jpg']);
    ignoreFn("foo.jpg", ".", false).should.be.true();
    ignoreFn("foodjpg", ".", false).should.be.false();
    ignoreFn("bar/foo.jpg", ".", false).should.be.true();
    ignoreFn("bar/moo/foo.jpg", ".", false).should.be.true();
    ignoreFn("bar/moo/foo.jpg", ".", false).should.be.true();
  });

  it('should not ignore files with extensions', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!*.jpg']);
    ignoreFn("foo.jpg", ".", false).should.be.true();
    ignoreFn("foodjpg", ".", false).should.be.false();
    ignoreFn("bar/bar.jpg", ".", false).should.be.true();
    ignoreFn("bar/moo/moo.jpg", ".", false).should.be.true();
    ignoreFn("bar/moo/lah.jpg", ".", false).should.be.true();
  });

  it('should not ignore files with prefix', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!abc*']);
    ignoreFn("abc", ".", false).should.be.true();
    ignoreFn("abcdef", ".", false).should.be.true();
    ignoreFn("foo/abc", ".", false).should.be.true();
    ignoreFn("foo/abcdef", ".", false).should.be.true();
    ignoreFn("abc/foo", ".", false).should.be.true();
    ignoreFn("abcdef/foo", ".", false).should.be.true();
  });

  it('should not ignore files questions', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!a?c']);
    ignoreFn("abc", ".", false).should.be.true();
    ignoreFn("adc", ".", false).should.be.true();
    ignoreFn("ac", ".", false).should.be.false();
  });

  it('should not ignore only root based', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!/foo']);
    ignoreFn("foo", ".", false).should.be.true();
    ignoreFn("foo/bar", ".", false).should.be.true();
    ignoreFn("bar/foo", ".", false).should.be.false();
  });

  it('should not ignore only dir', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['!foo/']);
    ignoreFn("foo", ".", true).should.be.true();
    ignoreFn("foo", ".", false).should.be.false();
    ignoreFn("foo/abc", ".", false).should.be.true();
    ignoreFn("bar/foo", ".", true).should.be.true();
    ignoreFn("bar/foo", ".", false).should.be.false();
  });

  it('should filter out "/src/"', function() {
    var ignoreFn = readdirtree.makeIgnoreFilter(['/src/']);
    [
      [ '3rdparty', '/Users/gregg/src/hft-garden', true ],
      [ 'LICENSE.md', '/Users/gregg/src/hft-garden', false ],
      [ 'README.md', '/Users/gregg/src/hft-garden', false ],
      [ 'assets', '/Users/gregg/src/hft-garden', true ],
      [ 'bower.json', '/Users/gregg/src/hft-garden', false ],
      [ 'bower_components', '/Users/gregg/src/hft-garden', true ],
      [ 'controller.html', '/Users/gregg/src/hft-garden', false ],
      [ 'css', '/Users/gregg/src/hft-garden', true ],
      [ 'game.html', '/Users/gregg/src/hft-garden', false ],
      [ 'icon.png', '/Users/gregg/src/hft-garden', false ],
      [ 'package.json', '/Users/gregg/src/hft-garden', false ],
      [ 'screenshot.png', '/Users/gregg/src/hft-garden', false ],
      [ 'scripts', '/Users/gregg/src/hft-garden', true ],
      [ 'src', '/Users/gregg/src/hft-garden', true, false ],
      [ 'scripts/stem.js', '/Users/gregg/src/hft-garden', false ],
      [ 'scripts/tree.js', '/Users/gregg/src/hft-garden', false ],
      [ 'scripts/tweeny.js', '/Users/gregg/src/hft-garden', false ],
      [ 'src/flap.psd', '/Users/gregg/src/hft-garden', false, false ],
      [ 'src/flap02.psd', '/Users/gregg/src/hft-garden', false, false ],
      [ 'src/flap03.psd', '/Users/gregg/src/hft-garden', false, false ],
    ].forEach(function(f) {
      var result = ignoreFn(f[0], f[1], f[2]);
      var expected = (f[3] === false) ? false : true;
      should.equal(result, expected, f[0]);
    });
  });

});
