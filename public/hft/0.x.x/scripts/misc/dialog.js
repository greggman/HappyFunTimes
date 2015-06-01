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

define([], function() {
  var zIndex = 15000;

  function create(name, options) {
    var elem = document.createElement(name);
    if (options.className) {
      elem.className = options.className;
    }
    var style = options.style;
    if (style) {
      Object.keys(style).forEach(function(key) {
        elem.style[key] = style[key];
      });
    }
    if (options.parent) {
      options.parent.appendChild(elem);
    }
    return elem;
  }

  function addElem(content, options) {
    var elem = create("div", options);
    if (content instanceof HTMLElement) {
      elem.appendChild(content);
    } else {
      elem.innerHTML = content;
    }
    return elem;
  }

  function close(elem) {
    elem.parentNode.removeChild(elem);
    --zIndex;
  }

  /**
   * @typedef {Object} Dialog~Choice
   * @property {string} msg message to display
   * @property {function} [callback] callback if this choice is picked.
   */

  /**
   * @typedef {Object} Dialog~Options
   * @property {string} [title] unused?
   * @property {(string|HTMLElement)} [msg]
   * @property {Dialog~Choice[]} [choices]
   */

  /**
   * Puts up a fullscreen dialog
   * @param {Dialog~Options} options options for dialog.
   * @param {function(?)) [callback] callback when dialog closes
   */
  function modal(options, callback) {
    if (!callback) {
      callback = function() {};
    }

    var cover     = create("div", { className: "hft-dialog-cover", style: { zIndex: zIndex++ } });
    var filler    = create("div", { className: "hft-fullcenter", parent: cover });
    var container = create("div", { className: "hft-dialog-container", parent: filler });

    var closeIt = function() {
      close(cover);
      callback();
    };

    if (options.title) {
      addElem(options.title, { className: "hft-dialog-title", parent: container });
    }

    addElem(options.msg, { className: "hft-dialog-content", parent: container });

    function addObjectChoice(choice, ndx) {
      var div = addElem("div", { className: "hft-dialog-choice", parent: container });
      div.innerHTML = choice.msg;
      var choiceCallback = function() {
        close(cover);
        (choice.callback || callback)(ndx);
      };
      div.addEventListener('click', choiceCallback);
      div.addEventListener('touchend', choiceCallback);
      return div;
    }

    function addStringChoice(msg, ndx) {
      addObjectChoice({
        msg: msg,
        callback: function() {
          callback(ndx);
        },
      });
    }

    if (options.choices) {
      options.choices.forEach(function(choice, ndx) {
       if (typeof choice === 'string') {
         addStringChoice(choice, ndx);
       } else {
         addObjectChoice(choice, ndx);
       }
      });
    } else if (callback) {
      container.addEventListener('click', closeIt, false);
      container.addEventListener('touchend', closeIt, false);
    }

    document.body.appendChild(cover);
  }

  return {
    modal: modal,
  };
});

