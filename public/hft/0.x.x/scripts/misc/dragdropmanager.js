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

define([
    'hft/misc/dialog',
    'hft/misc/misc',
    'hft/misc/strings',
  ], function(
    dialog,
    misc,
    strings) {

  function DragDropManager(options) {
    var inputElem = options.inputElem;
    var showElem = options.showElem;

    var badFiles = [];
    var pendingFiles = [];
    var uploading = false;
    var uploadNextFile;

    var noPropagate = function(e) {
      e.stopPropagation();
      if (e.preventDefault) {
        return e.preventDefault();
      } else {
        e.returnValue = false;
        return false;
      }
    };

    var showTarget;

    var hide = function(e) {
      if (e.target === showTarget) {
        showElem.style.display = "none";
      }
    };

    var show = function(e) {
      showTarget = e.target;
      showElem.style.display = "block";
    };

    var processFiles = function(e, fn) {
      if (!e.dataTransfer) {
        return;
      }
      var files = e.dataTransfer.files;
      if (files && files.length) {
        Array.prototype.forEach.call(files, function(file) {
          fn(file);
        });
      }
    };

    var addFile = function(file) {
      if (strings.endsWith(file.name, ".zip")) {
        console.log(file);
        pendingFiles.push(file);
      } else {
        badFiles.push(file);
      }
    };

    var handleError = function(msg) {
      msg = msg.replace(/\n/g, "<br/>");
      var div = document.createElement("div");
      div.innerHTML = msg;
      dialog.modal({
        title: "Oops",
        msg: div,
        choices: [
         { msg: "Ok", },
        ],
      }, uploadNextFile);
    };

    var uploadFile = function(file) {
      var xhr = new XMLHttpRequest();
      var url = window.location.origin + "/api/v0/install/";
      xhr.open("POST", url, true);
      xhr.onload = function(/* e */) {
        if (xhr.readyState !== 4) {
          return;
        }
        var success = xhr.status === 200 || xhr.status === 0;
        if (success) {
          try {
            var data = JSON.parse(xhr.responseText);
            if (data.success) {
              uploadNextFile();
            } else {
              handleError("could not install: " + file.name + "\n\n" + data.msg);
            }
          } catch (e) {
            handleError("could not install: " + file.name + "\n" + e);
          }
        }
      };
      xhr.onerror = function() {
        handleError("could not upload: " + file.name);
      };
      var formData = new FormData();
      formData.append("file", file, file.name);
      xhr.send(formData);
    };

    uploadNextFile = function() {
      if (!uploading) {
        if (pendingFiles.length) {
          var file = pendingFiles.shift();
          uploadFile(file);
        }
      }
    };

    //var old;
    //var oldTarget;
    //var debug = function(e) {
    //  try {
    //    if (e.type !== old || oldTarget !== e.target) {
    //      old = e.type;
    //      oldTarget = e.target;
    //      console.log(old, e.target.id, e.target.nodeName);
    //    //  processFiles(e, showFile);
    //    }
    //  } catch (e) {
    //    console.error(e);
    //  }
    //};
    var debug = function() {};

    misc.applyListeners(inputElem, {
      dragstart: function(e) {
        debug(e);
        show(e);
      },
      dragenter: function(e) {
        debug(e);
        show(e);
        return noPropagate(e);
      },
      dragover: function(e) {
        debug(e);
        show(e);
        return noPropagate(e);
      },
      dragleave: function(e) {
        debug(e);
        hide(e);
      },
      drag: function(e) {
        debug(e);
        // no-op
      },
      drop: function(e) {
        var result = noPropagate(e);
        debug(e);
        hide(e);
        processFiles(e, addFile);
        if (badFiles.length) {
          badFiles = [];
          handleError("Only .zip files are allowed");
        } else {
          uploadNextFile();
        }
        return result;
      },
      dragend: function(e) {
        debug(e);
        hide(e);
      },
    });
  }

  return DragDropManager;
});

