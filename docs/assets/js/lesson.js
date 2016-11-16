<!-- Licensed under a BSD license. See license.html for license -->
(function ($) {
    var log = function (msg) {
        return;
        if (window.dump) {
            dump(msg + "\n");
        }
        if (window.console && window.console.log) {
            console.log(msg);
        }
    };

    $(document).ready(function ($) {
        var g_imgs = {};

        var linkImgs = function (bigHref) {
            return function () {
                var src = this.src;
                var a = document.createElement('a');
                a.href = bigHref;
                a.title = this.alt;
                a.className = this.className;
                a.setAttribute('align', this.align);
                this.setAttribute('align', '');
                this.className = '';
                this.style.border = "0px";
                return a;
            };
        };

        var linkSmallImgs = function (ext) {
            return function () {
                var src = this.src;
                return linkImgs(src.substr(0, src.length - 7) + ext);
            };
        };

        var linkBigImgs = function () {
            var src = $(this).attr("big");
            return linkImgs(src);
        };

        $('img[big$=".jpg"]').wrap(linkBigImgs);
        $('img[src$="-sm.jpg"]').wrap(linkSmallImgs(".jpg"));
        $('img[src$="-sm.gif"]').wrap(linkSmallImgs(".gif"));
        $('img[src$="-sm.png"]').wrap(linkSmallImgs(".png"));

        $('pre code').each(function(i, block) {
            hljs.highlightBlock(block);
        });
    });
}(jQuery));
