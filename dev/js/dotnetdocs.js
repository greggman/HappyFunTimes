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

var fs      = require('fs');
var utils   = require('../../lib/utils');
var Promise = require('promise');
var xml2js   = require('xml2js');

var execP = Promise.denodeify(utils.execute);

var mdocPath = "/Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc";
var parser = new xml2js.Parser();
var parseP = Promise.denodeify(parser.parseString.bind(parser));

function generateDotNetDocs() {
  var dstPath = "docs/dotnet";
  var docPath = dstPath + "/doc.xml";
  var mdocEnv = JSON.parse(JSON.stringify(process.env));
  mdocEnv.MONO_PATH = "/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0";

  if (!fs.existsSync(dstPath)) {
    fs.mkdirSync(dstPath);
  }

  var dependencies = [
    "../hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll",
    "../hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll",
    "../hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll",
  ];

  return execP("mcs", [
        "../hft-unity3d/HappyFunTimes/*.cs",
        "/doc:" + docPath,
        "-t:library",
        "-r:" + dependencies.join(","),
      ])
    .then(function() {
      return parseP(fs.readFileSync(docPath, {encoding: "utf8"}));
    })
    .then(function(docs) {
      var root = {
        namespace: {
        },
      };

      function collectExample(example) {
        var a = example["_"] ? example["_"] + "\n" : "";
        var b = example["code"] ? '<pre class="prettyprint">' + example["code"].join("\n") + '</pre>' : "";
        return a + b;
      }

      function addEntry(collection, name, member) {
        collection[name] = {
          summary: member.summary ? member.summary.join("\n") : "",
          example: member.example ? collectExample(member.example.join("\n")) : "",
          returns: member.returns ? member.returns.join("\n") : "",
        };
        if (member.param) {
          collection.params = {};
          member.param.forEach(function(param) {
            var name = param["$"].name;
            collection.params[name] = {
              summary: param["_"],
            };
          });
        }
      }

      docs.doc.members[0].member.forEach(function(member) {
        var parts = member["$"].name.split(".");
        var namespaceName = parts[0];
        var className = parts[1];
        var name = parts.slice(2).join(".");
        parts = namespaceName.split(":");
        var type = parts[0];
        namespaceName = parts[1];
        var namespace = root.namespace[namespaceName];
        if (!namespace) {
          namespace = { types: {}};
          root.namespace[namespaceName] = namespace;
        }
        var classType;
        switch (type) {
          case 'T':  // type
            namespace.types[className] = {
              summary: member.summary ? member.summary.join("\n") : "",
              example: member.example ? collectExample(member.example.join("\n")) : "",
              returns: member.returns ? member.returns.join("\n") : "",
              methods: {},
              properties: {},
              fields: {},
            };
            break;
          case 'F':  // field
            classType = namespace.types[className];
            if (!classType) {
              console.error("unknown class name: " + className);
              return;
            }
            addEntry(classType.fields, name, member);
            break;
          case 'P':  // property
            classType = namespace.types[className];
            if (!classType) {
              console.error("unknown class name: " + className);
              return;
            }
            addEntry(classType.properties, name, member);
            break;
          case 'M':  // method
            classType = namespace.types[className];
            if (!classType) {
              console.error("unknown class name: " + className);
              return;
            }
            addEntry(classType.methods, name, member);
            break;
          default:
            console.warn("Unknown type:", type);
            break;
        }
      });

      console.log(JSON.stringify(root, undefined, "  "));
    });
}

module.exports = { generateDotNetDocs: generateDotNetDocs};
//generateDotNetDocs().catch(function(e) { console.error(e); }).done();

//    // extract inline docs
//    // mcs ~/src/hft-unity3d/HappyFunTimes/*.cs /doc:doc.xml -t:library -r:/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll,/Users/gregg/src/hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll
//    execP("mcs", [
//        "../../../hft-unity3d/HappyFunTimes/*.cs",
//        "/doc:doc.xml",
//        "-t:library",
//        "-r:../../../hft-unity3d/HappyFunTimes/bin/Release/DeJson.dll,../../../hft-unity3d/HappyFunTimes/bin/Release/UnityEngine.dll,../../../hft-unity3d/HappyFunTimes/bin/Release/websocket-sharp.dll",
//      ], {
//        cwd: dstPath,
//        env: process.env,
//      }).then(function() {
//        // generate xml
//        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc update -o en ~/src/hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll
//        return execP(mdocPath, [
//          "update",
//          "-o", "en",
//          "../../../hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll",
//        ], {
//          cwd: dstPath,
//          env: mdocEnv,
//        });
//      }).then(function() {
//        // merge inline docs with generated xml
//        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc export-html -o htmldocs en
//        return execP(mdocPath, [
//           "export-html",
//           "-o", "htmldocs", "en",
//        ], {
//          cwd: dstPath,
//          env: mdocEnv,
//        });
//      }).then(function() {
//        // generate xml
//        // MONO_PATH=/Applications/Unity/MonoDevelop.app/Contents/MacOS/lib/monodevelop/bin:/Applications/Unity/Unity.app/Contents/Frameworks/Mono/lib/mono/2.0 /Applications/Unity/Unity.app/Contents/Frameworks/Mono/bin/mdoc update -o en ~/src/hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll
//        return execP(mdocPath, [
//          "update",
//          "-o", "en",
//          "../../../hft-unity3d/HappyFunTimes/bin/Release/HappyFunTimes.dll",
//        ], {
//          cwd: dstPath,
//          env: mdocEnv,
//        });
//      }).then(function() {
//        done();
//      }).done();
//parser.parseString(fs.readFileSync("docs/dotnet/doc.xml", {encoding: "utf8"}), function (err, result) {
//        console.log(JSON.stringify(result, undefined, "  "));
//    });
