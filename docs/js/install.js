requirejs([
    './io',
  ], function(io) {
  var isLocal = window.location.hostname.indexOf("localhost") >= 0;
  var plat = navigator.platform.toLowerCase();
  if (plat.indexOf("mac") >= 0) {
    plat = "mac";
  } else if (plat.indexOf("win") >= 0) {
    plat = "win";
  }
  console.log("platform:", plat);

  var $ = document.getElementById.bind(document);

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

  function goToInstaller(err, str) {
    if (err) {
      console.error(err);
      return;
    }
    var downloadUrl = "http://superhappyfuntimes.net/install";
    var platInfos = JSON.parse(str);
    var platInfo = platInfos.platforms[plat];
    if (platInfo) {
      downloadUrl = platInfo.exeUrl;
    }
    console.log("go to:", downloadUrl);
    if (!isLocal) {
      window.location.href = downloadUrl;
    }
  }

  var search = parseSearchString(window.location.search);
  var base = search.domain || "superhappyfuntimes.net";
  var url = "http://" + base + "/assets/pages/install.json";
  io.get(url, "", goToInstaller);
});
