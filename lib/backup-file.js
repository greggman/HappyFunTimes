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
 * THEORY OF2 LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

"use strict";

var fs = require('fs');
var path = require('path');

function backup(filename, options) {
  options = options || {};
  var backupPath = options.backupPath || path.dirname(filename);
  var numBackups = options.numBackups || 5;
  var ext = path.extname(filename);
  var baseName = path.basename(filename, ext);

  function makeBackupName(num) {
    return path.join(backupPath, baseName + "." + num + ".bak" + ext);
  }

  function makeSrcName(num) {
    return num === 1 ? filename : makeBackupName(num - 1);
  }

  function copyFileSync(src, dst) {
    var contents = fs.readFileSync(src);
    fs.writeFileSync(dst, contents);
  }

  for (var ii = numBackups; ii > 0; --ii) {
    var dstPath = makeBackupName(ii);
    var srcPath = makeSrcName(ii);
    if (fs.existsSync(srcPath)) {
      copyFileSync(srcPath, dstPath);
    }
  }
}

exports.backup = backup;
