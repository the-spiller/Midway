/*---------------------------------------------------------------------------*/
/* Midway game: HTML5 and JQuery                                             */
/*---------------------------------------------------------------------------*/
var canvas = document.getElementById("maincanvas"),
    context = canvas.getContext("2d"),
    player = undefined,
    currentScene = "",
    scenes = {},
    sounds = {},
    DLG_WIDTH = 460,
    DLG_OK = 1,
    DLG_OKCANCEL = 2,
    DLG_YESNO = 3,
    showingInfo = false,
    IMG_WIDTH = 1387,
    IMG_HEIGHT = 275;

// Scenes......................................................................

// Logon scene.................................................................

var logon = function() {
    $("#content").load("_logon.html", function () {
        currentScene = logonPage.show();
    });
};
scenes["logon"] = logon;

// Home scene..................................................................

var home = function() {
    $("#content").load("_home.html", function() {
        currentScene = homePage.show();
    });
};
scenes["home"] = home;

// Registration scene..........................................................

var register = function() {
    $("#content").load("_register.html", function() {
        currentScene = registerPage.show();
    });
};
scenes["register"] = register;

// About scene.................................................................

var about = function() {
    $("#content").load("_about.html", function () {
        currentScene = aboutPage.show();
    });
};
scenes["about"] = about;

// Functions...................................................................

function drawBackground(url) {
    var img = new Image();
    img.src = url;
    img.onload = function () {
        $(canvas).attr("width", img.width);
        $(canvas).attr("height", img.height);
        context.drawImage(img, 0, 0);
    };
}

function setLeft(elementIds) {
    var elem, realLeft;
    
    for (var i = 0; i < elementIds.length; i++) {
        elem = "#" + elementIds[i];
        realLeft = Math.floor(($(window).width() - IMG_WIDTH) / 2);
        if (realLeft < 0) realLeft = 0;
        if ($(elem).length) {
            var left = document.getElementById(elementIds[i]).offsetLeft + realLeft;
            $(elem).css("left", left + "px");
        }
    }
}

function setInfolinkPos() {
    var width = IMG_WIDTH;
    if ($(window).width() < IMG_WIDTH) width = $(window).width();
    
    var left = Math.floor(($(window).width() - width) / 2) + width - 65;
    $("#infolink").css({ "top": "10px", "left": left + "px" });
    showingInfo = false;
    return left;
}

function showPhotoblurb() {
    showingInfo = !showingInfo;

    if (showingInfo) {
        if (currentScene == "logon") {
            $(".photoblurb").css({ "display": "block", "top": "394px", "left": $("#infolink").css("left") });
        } else {
            $(".photoblurb").css({ "display": "block", "top": "40px", "left": getPhotoBlurbLeft() + "px" });
        }
    } else {
        $(".photoblurb").css("display", "none");
    }
}

function getPhotoBlurbLeft() {
    var infolink = document.getElementById("infolink");
    return infolink.offsetLeft - 400;
}

function getAlertPosition() {
    var left = Math.floor(($(window).width() / 2) - (DLG_WIDTH / 2));
    var top = Math.floor($(window).scrollTop() + $(window).height() / 2) - 150;
    return { x: left, y: top };
}

function showAlert(title, message, buttons, color, callback) {
    var topLeft = getAlertPosition();
    
    function getAlertButtonHtml(text) {
        return "<a id='btn" + text.toLowerCase() + "' class='flatbutton " + color + "btn'>" + text + "</a>";
    }

    $("#dlghead").removeClass()
        .addClass(color + "dlghead")
        .css("width", (DLG_WIDTH - 10) + "px")
        .html(title);
    
    $("#dlgbody").html(message);
    
    switch (buttons) {
        case (DLG_OK):
            $("#dlgbuttons").html(getAlertButtonHtml("OK"));
            break;
        case (DLG_OKCANCEL):
            $("#dlgbuttons").html(getAlertButtonHtml("OK") + getAlertButtonHtml("Cancel"));
            break;
        case (DLG_YESNO):
            $("#dlgbuttons").html(getAlertButtonHtml("Yes") + getAlertButtonHtml("No"));
            break;
    }

    $("#dlgbuttons .flatbutton").on("click", function (e) {
        $("#dlgoverlay").css("display", "none");
        if (callback) callback(e.target.innerHTML);
    });
    
    $("#dlgcontent").removeClass().addClass(color + "dlg").css({
        "top": topLeft.y + "px",
        "left": topLeft.x + "px",
        "width": DLG_WIDTH + "px"
        }).draggable({
            handle: "#dlghead",
            containment: "#pagediv",
            scroll: false
        });

    $("#dlgoverlay").css("display", "block").focus();
}

function showWait(title, message, color) {
    var topLeft = getAlertPosition();
    
    $("#dlghead").removeClass().addClass(color + "dlghead").html(title);
    $("#dlgbody").html(message);
    $("#dlgcontent").removeClass().addClass(color + "dlg").css({
        "top": topLeft.y + "px",
        "left": topLeft.x + "px",
        "width": DLG_WIDTH
        }).draggable({
            handle: "#dlghead",
            containment: "#pagediv",
            scroll: false
        });

    $("#dlgoverlay").css("display", "block");
}

function ajaxGetPlayer(playerId, successCallback) {
    $.ajax({
        url: "/api/player/" + playerId.toString(),
        accepts: "application/json",
        success: function (data) {
            player = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            if (!errorThrown)
                showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "yellow");
            else
                showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "yellow");
        }
    });
}

function ajaxUpdatePlayer(successCallback) {
    $.ajax({
        url: "/api/player",
        type: "PUT",
        accepts: "application/json",
        data: player,
        success: function () {
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            if (!errorThrown)
                showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "yellow");
            else
                showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "yellow");
        }
    });
}

function ajaxRegisterPlayer(successCallback) {
    $.ajax({
        url: "/api/player",
        type: "POST",
        data: player,
        success: function (data) {
            player = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            if (!errorThrown)
                showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "yellow");
            else
                showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "yellow");
        }
    });
}

// Init........................................................................

$(document).ready(function () {
    
    // Event handlers..............................................................
    
    $("#dlgoverlay").on("keyup", function(e) {
        if (e.keyCode == 13) {
            if ($("#btnok").length)
                $("#btnok").trigger("click");
            else if ($("#btnyes").length)
                $("#btnyes").trigger("click");
        } else if (e.keyCode == 27) {
            if ($("#btncancel").length)
                $("#btncancel").trigger("click");
            else if ($("#btnno").length)
                $("#btnno").trigger("click");
        }
    });

    // Let's go....................................................................
    
    //sounds["teletype"] = new buzz.sound("/midway/content/audio/teletype", { formats: ["ogg", "mp3"] });
    showingInfo = false;
    
    var playerId;
    playerId = readLocal("player");
    
    if (playerId !== null) {
        showWait("Logging On", "Logging on, please wait ...", "blue");
        
        player = ajaxGetPlayer(playerId, function () {
            $("#dlgoverlay").css("display", "none");
            scenes["home"]();
            return;
        });
    }
    scenes["logon"]();
});
