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

var fs     = require('fs');
var hanson = require('hanson');
var eslint = require('eslint');
var path   = require('path');
var should = require('should');

describe('lint', function() {

  var configFile = path.join(__dirname, '..', 'dev', 'conf', 'eslint.json');
  var config = hanson.parse(fs.readFileSync(configFile, {encoding: "utf-8"}));

  config.rulePaths = [path.join(__dirname, '..', 'dev', 'rules')];
  config.configFile = configFile;

  var cli = new eslint.CLIEngine(config);
  config = cli.getConfigForFile(path.join(__dirname, "..", "server", "hft-server.js"));

  // console.log(config);

  [
    { rule: "require-trailing-comma/require-trailing-comma", code: "var a = [ 1, 2, 3 ]; console.log(a);", },
    { rule: "require-trailing-comma/require-trailing-comma", code: "var a = { a: 1, b: 2, c: 3 }; console.log(a);", },
    { rule: "quotes", code: "console.log('a');", },
    { rule: "quotes", code: 'console.log("a");', },
  ].forEach(function(test) {
      it('should pass ' + test.rule + ' rule', function() {
        var errors = eslint.linter.verify(test.code, config);
        errors.length.should.be.eql(0);
      });
    });

  [
    { rule: "hft-camelcase", code: "var some_var = 1; console.log(some_var);", },
    { rule: "optional-comma-spacing/optional-comma-spacing", code: "console.log('a','b');", },
    { rule: "comma-style", code: "var a = [1\n, 2,];\nconsole.log(a);", },
    { rule: "no-irregular-whitespace", code: "\u3000 // foo\n", },
    { rule: "no-mixed-spaces-and-tabs", code: "\t // foo\n", },
    { rule: "no-obj-calls", code: "Math();", },
    { rule: "no-unreachable", code: "'use strict';\nexports.a = function() {\n  return 1;\n  return 2;\n}", },
    { rule: "one-variable-per-var/one-variable-per-var", code: "var a = 1, b = 2; console.log(a, b);", },
    { rule: "require-trailing-comma/require-trailing-comma", code: "var a = [\n1,\n2,\n3 ]; console.log(a);", },
    { rule: "require-trailing-comma/require-trailing-comma", code: "var a = {\na: 1,\nb: 2,\nc: 3}; console.log(a);", },
    { rule: "semi", code: "console.log()", },
    { rule: "no-spaced-func", code: "console.log ('a');", },
    { rule: "space-after-function-name", code: "exports.a = function foo () { return 1; };", },
    { rule: "space-after-keywords", code: "if(process.env.a) { console.log('a'); };", },
    { rule: "curly", code: "if(process.env.a) console.log('a');", },
  ].forEach(function(test) {
    it('should fail ' + test.rule + ' rule', function() {
      var errors = eslint.linter.verify(test.code, config);
      errors[0].ruleId.should.be.eql(test.rule);
    });
  });

});

