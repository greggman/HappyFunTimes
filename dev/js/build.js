
module.exports = function (options) { // wrapper in case we're in module_context mode

"use strict";

var cache   = new (require('inmemfilecache'));
var Feed    = require('feed');
var fs      = require('fs');
var glob    = require('glob');
var marked  = require('marked');
var path    = require('path');
var Promise = require('Promise');
var sitemap = require('sitemap');
var subst   = new (require('./subst'));
var utils   = require('./../../lib/utils');

var executeP = Promise.denodeify(utils.execute);

marked.setOptions({
  rawHtml: true,
  //pedantic: true,
});


subst.registerReplaceHandler('include', function(filename, params) {
  return subst.replaceParams(readFile(filename, {encoding: "utf-8"}), params);
});

subst.registerReplaceHandler('example', function(options) {

  options.width = options.width || "400";
  options.height = options.height || "300";

  return subst.replaceParams(readFile("dev/templates/example.template"), options);
});

subst.registerReplaceHandler('diagram', function(options) {

  options.width = options.width || "400";
  options.height = options.height || "300";

  return subst.replaceParams(readFile("dev/templates/diagram.template"), options);
});

var readFile = function(fileName) {
  return cache.readFileSync(fileName, "utf-8");
};

var Builder = function(options) {

  var g_articles = [];

  function joinUrl() {
    return Array.prototype.map(function(part) {
      return (part.substr(-1) === "/") ? part.substr(0, part.length - 1) : part;
    }).join("/");
  }

  function writeFileIfChanged(fileName, content) {
    if (fs.existsSync(fileName)) {
      var old = readFile(fileName);
      if (content == old) {
        return;
      }
    }
    fs.writeFileSync(fileName, content);
    console.log("Wrote: " + fileName);
  };

  var extractHeader = (function() {
    var headerRE = /([A-Z0-9_-]+): (.*?)$/i;

    return function(content) {
      var metaData = { };
      var lines = content.split("\n");
      while (true) {
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

  var loadMD = function(contentFileName) {
    var content = cache.readFileSync(contentFileName, "utf-8");
    return extractHeader(content);
  };

  var applyTemplateToFile = function(defaultTemplatePath, contentFileName, outFileName, opt_extra) {
    console.log("processing: ", contentFileName);
    var data = loadMD(contentFileName);
    var templatePath = data.headers.template || defaultTemplatePath;
    var template = readFile(templatePath);
    // Call prep's Content which parses the HTML. This helps us find missing tags
    // should probably call something else.
    //Convert(md_content)
    var metaData = data.headers;
    var content = data.content;
    //console.log(JSON.stringify(metaData, undefined, "  "));
    content = content.replace(/%\(/g, '__STRING_SUB__');
    content = content.replace(/%/g, '__PERCENT__');
    content = content.replace(/__STRING_SUB__/g, '%(');
    content = subst.replaceParams(content, opt_extra || {});
    content = content.replace(/__PERCENT__/g, '%');
    var html = marked(content);
    metaData['content'] = html;
    metaData['src_file_name'] = contentFileName;
    metaData['dst_file_name'] = outFileName;
    metaData['basedir'] = "";
    metaData['url'] = joinUrl(options.baseurl, outFileName);
    metaData['screenshot'] = options.defaultOGImageURL;
    metaData['bs'] = options;

    var output = subst.replaceParams(template,  metaData);
    writeFileIfChanged(outFileName, output)
    g_articles.push(metaData);
  };

  var applyTemplateToFiles = function(templatePath, filesSpec) {
    var files = glob.sync(filesSpec);
    files.forEach(function(fileName) {
      var ext = path.extname(fileName);
      var baseName = fileName.substr(0, fileName.length - ext.length);
      var outFileName = baseName + ".html";
      applyTemplateToFile(templatePath, fileName, outFileName);
    });

  };

  this.process = function(filespec) {
    filespec = filespec || "*.md";
    applyTemplateToFiles("dev/templates/lesson.template", "docs/unity/" + filespec)

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
        return article.date != undefined;
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
        table_of_contents: "<ul>" + toc.join("\n") + "</ul>",
      });
      process.exit(0);  //
    }, function(err) {
      console.error("ERROR!:");
      console.error(err);
      if (err.stack) {
        console.error(err.stack);
      }
    });
  };

};

var b = new Builder(options);
b.process();
cache.clear();

};

