
var NullLogger = function() {
};

NullLogger.prototype.log = function() {
};

NullLogger.prototype.error = function() {
};

var ConsoleLogger = function() {
};

ConsoleLogger.prototype.log = function() {
  console.log.apply(console, arguments);
};

ConsoleLogger.prototype.error = function() {
  console.error.apply(console, arguments);
};

var HTMLLogger = function(element, opt_maxLines) {
  this.container = element;
  this.maxLines = opt_maxLines || 10;
  this.lines = [];
};

HTMLLogger.prototype.addLine_ = function(msg, color) {
  var line;
  var text;
  if (this.lines.length < this.maxLines) {
	line = document.createElement("div");
	text = document.createTextNode("");
	line.appendChild(text);
  } else {
	line = this.lines.shift();
	line.parentNode.removeChild(line);
	text = line.firstChild;
  }

  this.lines.push(line);
  text.nodeValue = msg;
  line.style.color = color;
  this.container.appendChild(line);
};

// FIX! or move to strings.js
var argsToString = function(args) {
  var lastArgWasNumber = false;
  var numArgs = args.length;
  var strs = [];
  for (var ii = 0; ii < numArgs; ++ii) {
    var arg = args[ii];
    if (arg === undefined) {
      strs.push('undefined');
    } else if (typeof arg == 'number') {
      if (lastArgWasNumber) {
        strs.push(", ");
      }
      if (arg == Math.floor(arg)) {
        strs.push(arg.toFixed(0));
      } else {
      strs.push(arg.toFixed(3));
      }
      lastArgWasNumber = true;
    } else if (window.Float32Array && arg instanceof Float32Array) {
      // TODO(gman): Make this handle other types of arrays.
      strs.push(tdl.string.argsToString(arg));
    } else {
      strs.push(arg.toString());
      lastArgWasNumber = false;
    }
  }
  return strs.join("");
};

HTMLLogger.prototype.log = function() {
  this.addLine_(argsToString(arguments), undefined);
};

HTMLLogger.prototype.error = function() {
  this.addLine_(argsToString(arguments), "red");
};



