// Event Handlers......................................................

$("#return").on("click", function () {
    location.replace("/index.html");
});

$("#infolink").on("click", function () {
    showPhotoblurb();
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

$(document).ready(function () {
    window.currentPage = "about";
});
