
module.exports = function (options) { // wrapper in case we're in module_context mode

"use strict";

var cache      = new (require('inmemfilecache'));
var Feed       = require('feed');
var fs         = require('fs');
var glob       = require('glob');
var Handlebars = require('handlebars');
var marked     = require('marked');
var path       = require('path');
var Promise    = require('Promise');
var sitemap    = require('sitemap');
var url        = require('url');
var utils      = require('./../../lib/utils');

var executeP = Promise.denodeify(utils.execute);

marked.setOptions({
  rawHtml: true,
  //pedantic: true,
});

function applyObject(src, dst) {
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
}

function mergeObjects() {
  var merged = {};
  Array.prototype.slice.call(arguments).forEach(function(src) {
    applyObject(src, merged);
  });
  return merged;
}

function readFile(fileName) {
  return cache.readFileSync(fileName, "utf-8");
}

function replaceParams(str, params) {
  var template = Handlebars.compile(str);
  if (Array.isArray(params)) {
    params = mergeObjects.apply(null, params.slice.reverse());
  }

  return template(params);
}

function TemplateManager() {
  var templates = {};

  this.apply = function(filename, params) {
    var template = templates[filename];
    if (!template) {
      template = Handlebars.compile(readFile(filename));
      templates[filename] = template;
    }

    if (Array.isArray(params)) {
      params = mergeObjects.apply(null, params.slice.reverse());
    }

    return template(params);
  };
}

var templateManager = new TemplateManager();

Handlebars.registerHelper('include', function(filename, options) {
  return templateManager.apply(filename, options.data.root);
});

Handlebars.registerHelper('example', function(options) {

  options.hash.width  = options.hash.width || "400";
  options.hash.height = options.hash.height || "300";

  return templateManager.apply("dev/templates/example.template", options.hash);
});

Handlebars.registerHelper('diagram', function(options) {

  options.hash.width  = options.hash.width || "400";
  options.hash.height = options.hash.height || "300";

  return templateManager.apply("dev/templates/diagram.template", options.hash);
});

function Builder(options) {

  var g_articles = [];

  function joinUrl() {
    return Array.prototype.map.call(arguments, function(part) {
      return (part.substr(-1) === "/") ? part.substr(0, part.length - 1) : part;
    }).join("/");
  }

  function writeFileIfChanged(fileName, content) {
    if (fs.existsSync(fileName)) {
      var old = readFile(fileName);
      if (content === old) {
        return;
      }
    }
    fs.writeFileSync(fileName, content);
    console.log("Wrote: " + fileName);
  }

  var extractHeader = (function() {
    var headerRE = /([A-Z0-9_-]+): (.*?)$/i;

    return function(content) {
      var metaData = { };
      var lines = content.split("\n");
      while (true) {  // eslint-disable-line
        var line = lines[0].trim();
        var m = headerRE.exec(line);
        if (!m) {
          break;
        }
        metaData[m[1].toLowerCase()] = m[2];
        lines.shift();
      }
      return {
        content: lines.join("\n"),
        headers: metaData,
      };
    };
  }());

  function loadMD(contentFileName) {
    var content = cache.readFileSync(contentFileName, "utf-8");
    return extractHeader(content);
  }

  function extractHandlebars(content) {
    var tripleRE = /\{\{\{.*?\}\}\}/g;
    var doubleRE = /\{\{\{.*?\}\}\}/g;

    var numExtractions = 0;
    var extractions = {
    };

    function saveHandlebar(match) {
      var id = "==HANDLEBARS_ID_" + (++numExtractions) + "==";
      extractions[id] = match;
      return id;
    }

    content = content.replace(tripleRE, saveHandlebar);
    content = content.replace(doubleRE, saveHandlebar);

    return {
      content: content,
      extractions: extractions,
    };
  }

  function insertHandlebars(info, content) {
    var handlebarRE = /==HANDLEBARS_ID_\d+==/g;

    function restoreHandlebar(match) {
      var value = info.extractions[match];
      if (value === undefined) {
        throw new Error("no match restoring handlebar for: " + match);
      }
      return value;
    }

    content = content.replace(handlebarRE, restoreHandlebar);

    return content;
  }

  var mdRE = /href="(.*?)"/g;
  function fixMDLink(match, link) {
    var urlObj = url.parse(link);
    if (urlObj.pathname && urlObj.pathname.substr(-3) === ".md") {
      urlObj.pathname = urlObj.pathname.substr(0, urlObj.pathname.length - 3) + ".html";
      link = 'href="' + url.format(urlObj) + '"';
    } else {
      link = 'href="' + link + '"';
    }
    return link;
  }

  function makeRedirect(url) {
    if (!url) {
      return '';
    }
    url = url.replace('.md', '.html');
    return [
      '<meta http-equiv="refresh" content="0; URL=\'${url}\'" />',
      '<script>',
      '   window.location.href = "${url}"',
      '</script>',
    ].join("\n").replace(/\$\{url\}/g, url);
  }

  function applyTemplateToFile(defaultTemplatePath, contentFileName, outFileName, opt_extra) {
    console.log("processing: ", contentFileName);
    opt_extra = opt_extra || {};
    var mergedOptions = mergeObjects(options, opt_extra);
    var data = loadMD(contentFileName);
    var templatePath = data.headers.template || defaultTemplatePath;
    // Call prep's Content which parses the HTML. This helps us find missing tags
    // should probably call something else.
    //Convert(md_content)
    var metaData = data.headers;
    var content = data.content;
    //console.log(JSON.stringify(metaData, undefined, "  "));
    var info = extractHandlebars(content);
    var html = marked(info.content);
    html = html.replace(mdRE, fixMDLink);
    html = insertHandlebars(info, html);
    html = replaceParams(html, opt_extra);
    metaData['content'] = html;
    metaData['src_file_name'] = contentFileName;
    metaData['dst_file_name'] = outFileName;
    metaData['basedir'] = "";
    metaData['url'] = joinUrl(mergedOptions.baseurl, outFileName);
    metaData['screenshot'] = mergedOptions.defaultOGImageURL;
    metaData['bs'] = mergedOptions;
    metaData['redirect'] = makeRedirect(metaData['redirect']);

    var output = templateManager.apply(templatePath, metaData);
    writeFileIfChanged(outFileName, output);
    g_articles.push(metaData);
  }

  function applyTemplateToFiles(templatePath, filesSpec, specOptions) {
    var files = glob.sync(filesSpec);
    files.forEach(function(fileName) {
      var ext = path.extname(fileName);
      var baseName = fileName.substr(0, fileName.length - ext.length);
      var outFileName = baseName + ".html";
      applyTemplateToFile(templatePath, fileName, outFileName, specOptions);
    });
  }

  this.process = function(filespec) {
    options.files.forEach(function(spec) {
       applyTemplateToFiles(spec.template || options.template, spec.filespec, spec);
    });

    var toc = [];
    g_articles.forEach(function(article) {
      toc.push('<li><a href="' + article.dst_file_name + '">' + article.title + '</a></li>');
    });

    var tasks = g_articles.map(function(article, ndx) {
      return function() {
        return executeP('git', [
          'log',
          '--format="%ci"',
          '--name-only',
          '--diff-filter=A',
          article.src_file_name,
        ]).then(function(result) {
          var dateStr = result.stdout.split("\n")[0];
          article.date = new Date(Date.parse(dateStr));
        });
      };
    });

    tasks.reduce(function(cur, next){
        return cur.then(next);
    }, Promise.resolve()).then(function() {
      var articles = g_articles.filter(function(article) {
        return article.date !== undefined;
      });
      articles = articles.sort(function(a, b) {
        return a.date > b.date ? -1 : (a.date < b.date ? 1 : 0);
      });

      //var feed = new Feed({
      //  title:          'HappyFunTimes',
      //  description:    'A Library for using your phone as a controller for 50 player games',
      //  link:           'http://superhappyfuntimes.net/',
      //  image:          'http://happyfuntimes.net/docs/images/happyfuntimes.jpg',
      //  updated:        articles[0].date,
      //  author: {
      //    name:       'Greggman',
      //    link:       'http://blog.happyfuntimes.net/',
      //  },
      //});
      //
      //var sm = sitemap.createSitemap ({
      //  hostname: 'http://docs.happyfuntimes.net',
      //  cacheTime: 600000,
      //});
      //
      //articles.forEach(function(article, ndx) {
      //  feed.addItem({
      //    title:          article.title,
      //    link:           "http://docs.happyfuntimes.net/" + article.dst_file_name,
      //    description:    "",
      //    author: [
      //      {
      //        name:       'Greggman',
      //        link:       'http://blog.happyfuntimes.net/',
      //      },
      //    ],
      //    // contributor: [
      //    // ],
      //    date:           article.date,
      //    // image:          posts[key].image
      //  });
      //  sm.add({
      //    url: "http://docs.happyfuntimes.net/" + article.dst_file_name,
      //    changefreq: 'monthly',
      //  });
      //});
      //try {
      //  writeFileIfChanged("atom.xml", feed.render('atom-1.0'));
      //  writeFileIfChanged("sitemap.xml", sm.toString());
      //} catch (err) {
      //  return Promise.reject(err);
      //}
      return Promise.resolve();
    }).then(function() {
      applyTemplateToFile("dev/templates/index.template", "index.md", "index.html", {
        tableOfContents: "<ul>" + toc.join("\n") + "</ul>",
      });
      //process.exit(0);  //
    }, function(err) {
      console.error("ERROR!:");
      console.error(err);
      if (err.stack) {
        console.error(err.stack);
      }
    });
  };

}

var b = new Builder(options);
b.process();
cache.clear();

};

