requirejs([
    './io',
], function (io) {
    // exit if we've already been here.
    if (window.location.hash === "#downloaded") {
        return;
    }
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
        str.split("&").forEach(function (part) {
            var pair = part.split("=").map(decodeURIComponent);
            results[pair[0]] = pair[1] !== undefined ? pair[1] : true;
        });
        return results;
    }

    function startInstaller(err, str) {
        if (err) {
            console.error(err);
            return;
        }
        var platInfos = JSON.parse(str);
        var platInfo = platInfos.platforms[plat];
        if (!platInfo) {
            if (!isLocal) {
                window.location.href = "http://superhappyfuntimes.net";
            }
            return;
        }

        var downloadUrl = platInfo.exeUrl;
        console.log("dl:", downloadUrl);
        var iframe = document.createElement("iframe");
        iframe.style.display = "none";
        document.body.appendChild(iframe);
        iframe.src = downloadUrl;
        // replace the url otherwise if the user goes to a new page and then
        // back here we'll start downloading again.
        window.history.replaceState({}, "", window.location.href + "#downloaded");
    }

    var search = parseSearchString(window.location.search);
    var base = search.domain || "superhappyfuntimes.net";
    var url = "http://" + base + "/assets/pages/install.json";
    io.get(url, "", startInstaller);
});
