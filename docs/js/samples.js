requirejs([
    './io',
  ], function(io) {
  var isLocal = window.location.hostname.indexOf("localhost") >= 0;
  function parseSearchString(str) {
    if (str[0] === '?') {
      str = str.substring(1);
    }
    var results = {};
    str.split("&").forEach(function(part) {
      var pair = part.split("=").map(decodeURIComponent);
      results[pair[0]] = pair[1] !== undefined ? pair[1] : true;
    });
    return results;
  }

  var $ = document.getElementById.bind(document);

  function setButtonTarget(id, url) {
    var elem = $(id);
    elem.href = url;
    elem.parentNode.style.display = "block";
  }

  function downloadLatest(err, str) {
    if (err) {
      console.error(err);
      return;
    }
    var endRE = /\.unitypackage$/;
    var release = JSON.parse(str);
    release.assets.forEach(function(asset) {
      if (endRE.test(asset.browser_download_url)) {
        setButtonTarget("package", asset.browser_download_url);
        console.log("dl:", asset.browser_download_url);
        // exit if we've already been here.
        if (window.location.hash === "#downloaded") {
          return;
        }
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        iframe.src = asset.browser_download_url;
        // replace the url otherwise if the user goes to a new page and then
        // back here we'll start downloading again.
        window.history.replaceState({}, "", window.location.href + "#downloaded");
      }
    });
  }

  var search = parseSearchString(window.location.search);
  if (search.repo && search.owner) {

    setButtonTarget("github", "http://github.com/" + search.owner + "/" + search.repo);
    setButtonTarget("files", "http://github.com/" + search.owner + "/" + search.repo + "/releases/latest");

    var url = "https://api.github.com/repos/" + search.owner + "/" + search.repo + "/releases/latest";
    console.log(url);
    if (isLocal) {
      downloadLatest(null, JSON.stringify({
        assets: [
          {
            browser_download_url: "https://foo.com/foo.bar.unitypackage",
          },
        ],
      }));
    } else {
      io.get(url, "", downloadLatest);
    }
  }

});
