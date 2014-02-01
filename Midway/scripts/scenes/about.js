var aboutPage = {
    show: function () {
        // Event Handlers......................................................

        $("#return").on("click", function () {
            scenes["logon"]();
        });

        $("#infolink").on("click", function () {
            showPhotoblurb();
        });

        $(".closex").on("click", function () {
            $("#infolink").trigger("click");
        });

        $(".expander").on("click", function () {
            var subUl = $(this).parent().find("ul");
            var subSpan = $(this).find("span");
            $(subUl).slideToggle();
            if ($(subSpan).hasClass("ui-icon-minusthick")) {
                $(subSpan).removeClass("ui-icon-minusthick").addClass("ui-icon-plusthick");
            } else {
                $(subSpan).removeClass("ui-icon-plusthick").addClass("ui-icon-minusthick");
            }
        });

        // Init................................................................

        drawBackground("content/images/head-about.jpg");

        $("#pagetitle").css("top", "90px");
        $("#welcome").css("top", "205px");

        var left = setInfolinkPos();
        $("#return").css("left", left - 40 + "px");
        setLeft(["pagetitle", "welcome"]);

        var availHeight = $(window).height() - IMG_HEIGHT - 40;
        var realLeft = Math.floor(($(window).width() - IMG_WIDTH) / 2);
        if (realLeft < 0) realLeft = 0;
        $("#nav").css({ "height": availHeight + "px", "left": realLeft + "px" });

        var navWidth = document.getElementById("nav").offsetWidth;
        var leftMargin = realLeft + navWidth + 4;
        var fudge = 55;
        var availWidth = IMG_WIDTH - navWidth - fudge;
        if ($(window).width() < IMG_WIDTH && $(window).width() > navWidth)
            availWidth = $(window).width() - navWidth - fudge;

        availHeight = availHeight + 8;
        $("#words").css({
            "height": availHeight + "px",
            "margin-left": leftMargin + "px",
            "width": availWidth + "px"
        });

        return "about";
    }
};