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

define(function() {
  // Grid is basically a managed html table.
  //
  // Grid inserts it into `container`. You can change the size of
  // the table with `grid.setDimensions(numColumns, numRows)`.
  // You can get access to a cell's element with
  // `grid.getElement(x, y)`.
  //
  // options:
  //   container: element to add grid
  //   columns: num columns
  //   rows: num rows
  var Grid = function(options) {

    var Cell = function() {
      var element = document.createElement('td');

      this.getElement = function() {
        return element;
      };

      this.remove = function() {
        element.parentNode.removeChild(element);
      };
    };

    var Row = function(numColumns) {
      var element = document.createElement('tr');
      var cells = [];

      this.setNumColumns = function(numColumns) {
        while (numColumns > cells.length) {
          var cell = new Cell();
          cells.push(cell);
          element.appendChild(cell.getElement());
        }
        var oldCells = cells.splice(numColumns);
        for (var ii = 0; ii < oldCells.length; ++ii) {
          oldCells[ii].remove();
        }
      };

      this.forEach = function(fn, yy) {
        for (var ii = 0; ii < cells.length; ++ii) {
          fn(cells[ii].getElement(), ii, yy);
        }
      };

      this.getCell = function(x) {
        return cells[x];
      };

      this.getElement = function() {
        return element;
      };

      this.remove = function() {
        element.parentNode.removeChild(element);
      };

      this.setNumColumns(numColumns);
    };

    var grid = [];
    var baseElement = options.container;
    var table = document.createElement("table");
    var tbody = document.createElement("tbody");

    this.getRow = function(y) {
      return grid[y];
    };

    // Gets an element.
    this.getElement = function(x, y) {
      var row = grid[y];
      return row.getCell(x).getElement();
    };

    // Calls fn for each element, passes in element, x, y.
    this.forEach = function(fn) {
      for (var y = 0; y < grid.length; ++y) {
        var row = grid[y];
        row.forEach(fn, y);
      }
    };

    this.setDimensions = function(numColumns, numRows) {
      var numExistingRows = Math.min(numColumns, grid.length);
      for (var ii = 0; ii < numExistingRows; ++ii) {
        grid[ii].setNumColumns(numColumns);
      }
      while (grid.length < numRows) {
        var row = new Row(numColumns);
        tbody.appendChild(row.getElement());
        grid.push(row);
      }
      var oldRows = grid.splice(numRows);
      for (var ii = 0; ii < oldRows.length; ++ii) {
        oldRows[ii].remove();
      }
    };

    this.setDimensions(options.columns, options.rows);
    table.appendChild(tbody);
    options.container.appendChild(table);
  };

  return Grid;
});
