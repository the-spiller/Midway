﻿/*---------------------------------------------------------------------------*/
/* Midway game: HTML5 and JQuery                                             */
/*---------------------------------------------------------------------------*/
var player = undefined,
    DLG_WIDTH = 460,
    DLG_OK = 1,
    DLG_OKCANCEL = 2,
    DLG_YESCANCEL = 3,
    showingInfo = false,
    IMG_WIDTH = 1387,
    IMG_HEIGHT = 857,
    COOKIE_NAME = "mdyplayer";

// Functions...................................................................

function showPhotoblurb() {
    showingInfo = !showingInfo;

    if (showingInfo) {
        if (currentPage == "logon") {
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
        return "<a id=\"dlgbtn\"" + text.toLowerCase() + " class=\"flatbutton " + color + "btn\">" + text + "</a>";
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
        e.stopPropagation();
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

function showAjaxError(xhr, status, errorThrown) {
    if (!errorThrown)
        showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "red");
    else {
        var errText = xhr.responseText,
            idx = errText.indexOf("{\"Message\":");
        
        if (idx == 0)
            errText = errText.substr(12, errText.length - 14);
     
        showAlert(xhr.status + " " + errorThrown, errText, DLG_OK, "red");
    }
}

function loadPlayerForPage(callback) {
    var cookie = readCookie(COOKIE_NAME);
    if (cookie) {
        var playerId = cookie.substr(0, cookie.indexOf(":"));
        ajaxGetPlayer(playerId, function() {
            if (callback) callback();
        });
    }
}
function createUpdateAuthCookie() {
    createCookie(COOKIE_NAME, window.player.PlayerId + ":" + window.player.AuthKey, 1);
}
function ajaxGetPlayer(playerId, successCallback) {
    $.ajax({
        url: "/api/player/" + playerId.toString(),
        accepts: "application/json",
        success: function (data) {
            window.player = JSON.parse(data);
            createUpdateAuthCookie();
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
        contentType: "application/json",
        accepts: "application/json",
        data: JSON.stringify(shallowPlayer),
        success: function (data) {
            window.player = JSON.parse(data);
            createUpdateAuthCookie();
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
        url: "/api/player",
        type: "GET",
        accepts: "application/json",
        success: function(data) {
            playersList = JSON.parse(data);
            createUpdateAuthCookie();
            if (successCallback) successCallback(playersList);
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

function ajaxLoadScript(script, successCallback) {
    $.ajax({
        url: script,
        dataType: "script",
        type: "GET",
        success: function() {
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

function workTabs(e) {
    $(".tablistitem, .tabpanel").removeClass("tabshown");
    var clickedId = e.target.id;
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

function findGameById(id, games) {
    var game = {};
    for (var i = 0; i < games.length; i++) {
        if (games[i].GameId == id) {
            game = games[i];
            break;
        }
    }
    return game;
}

// Global event handlers.......................................................

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

$(".closex").on("click", function () {
    $("#infolink").trigger("click");
});
