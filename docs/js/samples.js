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

  function goToLatest(err, str) {
    if (err) {
      console.error(err);
      return;
    }
    var endRE = /\.unitypackage$/;
    var release = JSON.parse(str);
    release.assets.forEach(function(asset) {
      if (endRE.test(asset.browser_download_url)) {
        setButtonTarget("package", asset.browser_download_url);
        if (!isLocal) {
          window.location.href = asset.browser_download_url;
        }
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
      goToLatest(null, JSON.stringify({
        assets: [
          {
            browser_download_url: "https://foo.com/foo.bar.unitypackage",
          },
        ],
      }));
    } else {
      io.get(url, "", goToLatest);
    }
  }

});
