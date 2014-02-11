var aboutPage = {
    run: function () {
        var ABOUT_IMG_HEIGHT = 275;
        
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

        $("#pagediv").css("background-image", "url(\"content/images/head-about.jpg\")");

        $("#pagetitle").css("top", "85px");
        $("#welcome").css("top", "195px");

        return "about";
    }
};