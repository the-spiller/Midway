var bgMusic;

// Event Handlers......................................................

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
    bgMusic = new Howl({
        urls: [AUDIO_DIR_MUSIC + "logon.ogg", AUDIO_DIR_MUSIC + "logon.mp3"],
        autoplay: false,
        loop: true
    });
    bgMusic.play().fade(0, 1, 1000);
   
    window.currentPage = "about";
});
