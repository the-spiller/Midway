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
    DLG_YESCANCEL = 3,
    showingInfo = false,
    IMG_WIDTH = 1387,
    IMG_HEIGHT = 857;

// Scenes......................................................................

var logon = function() {
    $("#content").load("_logon.html", function () {
        currentScene = logonPage.run();
    });
};
scenes["logon"] = logon;

var home = function() {
    $("#content").load("_home.html", function() {
        currentScene = homePage.run();
    });
};
scenes["home"] = home;

var register = function() {
    $("#content").load("_register.html", function() {
        currentScene = registerPage.run();
    });
};
scenes["register"] = register;

var about = function() {
    $("#content").load("_about.html", function () {
        currentScene = aboutPage.run();
    });
};
scenes["about"] = about;

var search = function() {
    $("#content").load("_search.html", function() {
        currentScene = searchPage.run();
    });
};
scenes["search"] = search;

// Functions...................................................................

function drawImage(url, x, y, opacity, callback) {
    context.globalAlpha = opacity;
    var img = new Image();
    img.src = url;
    img.onload = function() {
        context.drawImage(img, x, y);
        if (callback) callback();
    };
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
        return "<a id='dlgbtn" + text.toLowerCase() + "' class='flatbutton " + color + "btn'>" + text + "</a>";
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
        case (DLG_YESCANCEL):
            $("#dlgbuttons").html(getAlertButtonHtml("Yes") + getAlertButtonHtml("Cancel"));
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

function showAjaxError(xhr, status, errorThrown) {
    if (!errorThrown)
        showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "yellow");
    else
        showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "yellow");
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
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

function ajaxUpdatePlayer(shallowPlayer, successCallback) {
    $.ajax({
        url: "/api/player",
        type: "PUT",
        accepts: "application/json",
        data: shallowPlayer,
        success: function (data) {
            player = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

function ajaxGetPlayers(successCallback) {
    var playersList;

    $.ajax({
        url: "api/player",
        type: "GET",
        accepts: "application/json",
        success: function(data) {
            playersList = JSON.parse(data);
            if (successCallback) successCallback(playersList);
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

function workTabs(clickEvent) {
    $(".tablistitem, .tabpanel").removeClass("tabshown");
    var clickedId = clickEvent.target.id;
    $("#" + clickedId).addClass("tabshown");
    $("#" + clickedId.replace("tab", "")).addClass("tabshown");
}

function gameTimeFromTurn(turn) {
    var year = 1942,
        month = 6,
        day = 3,
        hour = 5;

    switch (true) {
        case (turn > 1 && turn < 9):
            hour += (turn - 1) * 2;
            break;
        case (turn == 9):
            day = 4;
            hour = 0;
            break;
        case (turn > 9 && turn < 18):
            day = 4;
            hour = 5 + ((turn - 10) * 2);
            break;
        case (turn == 18):
            day = 5;
            hour = 0;
            break;
        case (turn > 18 && turn < 27):
            day = 5;
            hour = 5 + ((turn - 19) * 2);
            break;
        case (turn == 27):
            day = 6;
            hour = 0;
            break;
        case (turn > 27):
            day = 6;
            hour = 5 + ((turn - 28) * 2);
            break;
        default:
            break;
    }
    return new Date(year, month, day, hour);
} 

// Global event handlers..............................................................

$("#dlgoverlay").on("keyup", function (e) {
    if (e.keyCode == 13) {
        if ($("#dlgbtnok").length)
            $("#dlgbtnok").trigger("click");
        else if ($("#dlgbtnyes").length)
            $("#dlgbtnyes").trigger("click");
    } else if (e.keyCode == 27) {
        if ($("#dlgbtncancel").length)
            $("#dlgbtncancel").trigger("click");
        else if ($("#dlgbtnno").length)
            $("#dlgbtnno").trigger("click");
    }
});

// Init........................................................................

$(document).ready(function () {

    // Tooltips................................................................

    $(document).tooltip({ tooltipClass: "mi-tooltip" });

    // Let's go................................................................
    
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
