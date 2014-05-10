/*---------------------------------------------------------------------------*/
/* Midway game: HTML5 and JQuery                                             */
/*---------------------------------------------------------------------------*/
var player = undefined,
    DLG_WIDTH = 460,
    DLG_OK = 1,
    DLG_OKCANCEL = 2,
    DLG_YESCANCEL = 3,
    DLG_YESNO = 4,
    AUDIO_DIR_SFX = "/content/audio/sfx/",
    AUDIO_DIR_MUSIC = "/content/audio/music/",
    showingInfo = false,
    showingVol = false,
    BG_IMG_WIDTH = 1387,
    BG_IMG_HEIGHT = 857,
    COOKIE_NAME_AUTH = "mdyplayer",
    COOKIE_NAME_AUDIO = "audiovol",
    supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints;

// Functions...................................................................

function navigateTo(music, url) {
    if (music && (music.volume() > 0)) {
        music.fade(music.volume(), 0, 1000);
        setTimeout(function() { document.location.href = url; }, 1000);
    } else {
        document.location.href = url;
    }
}

function showPhotoblurb() {
    showingInfo = !showingInfo;
    var coords = getPhotoBlurbPosition(),
        displayVal = showingInfo ? "block" : "none";
    
    $(".photoblurb").css({ "top": coords.y + "px", "left": coords.x + "px", "display": displayVal });
}

function getPhotoBlurbPosition() {
    var pos = getElementTopLeft(document.getElementById("infolink"));

    if (currentPage != "logon") {
        pos.x -= 410;
        pos.y -= 6;
    }
    return pos;
}

function showVolSlider() {
    showingVol = !showingVol;
    var coords = getVolSliderPosition(),
        displayVal = showingVol ? "block" : "none";
    
    $("#volsliderdiv").css({ "top": coords.y + "px", "left": coords.x + "px", "display": displayVal });
}

/*-----------------------------------------------------------------------------*/
/*-----------------------------------------------------------------------------*/
function getVolSliderPosition() {
    var pos = getElementTopLeft(document.getElementById("audiolink"));
    pos.x -= 2;
    pos.y += 30;
    return pos;
}

/*-----------------------------------------------------------------------------*/
/*-----------------------------------------------------------------------------*/
function getAlertPosition() {
    var left = Math.floor(($(window).width() / 2) - (DLG_WIDTH / 2));
    var top = Math.floor($(window).scrollTop() + $(window).height() / 2) - 150;  //150px above center
    return { x: left, y: top };
}

/*-----------------------------------------------------------------------------*/
/* Display modal "message box"                                                 */
/*-----------------------------------------------------------------------------*/
function showAlert(title, message, buttons, color, callback) {
    var topLeft = getAlertPosition();
    
    function getAlertButtonHtml(text) {
        return "<a id=\"dlgbtn" + text.toLowerCase() + "\" class=\"flatbutton " + color + "btn\">" + text + "</a>";
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
        case (DLG_YESNO):
            $("#dlgbuttons").html(getAlertButtonHtml("Yes") + getAlertButtonHtml("No"));
    }

    $("#dlgbuttons .flatbutton").on("click", function (e) {
        e.stopPropagation();
        $("#dlgcontent").css("display", "none");
        $("#dlgoverlay").css("display", "none");
        if (callback) callback(e.target.innerHTML);
    });
    
    $("#dlgcontent").removeClass().addClass(color + "dlg").css({
        display: "block",
        top: topLeft.y + "px",
        left: topLeft.x + "px",
        width: DLG_WIDTH + "px"
        }).draggable({
            handle: "#dlghead",
            containment: "#pagediv",
            scroll: false
        });

    hideWait();
    $("#dlgoverlay").css("display", "block").focus();
}

function showWait(waitMsg) {
    var topLeft = getAlertPosition(),
        waitHtml = "<img src=\"/content/images/blueloader.gif\" style=\"margin-right: 10px;\">" + waitMsg;

    $("#waitmsg").removeClass().addClass("bluedlg").css({
        top: topLeft.y + "px",
        left: topLeft.x + "px",
        width: DLG_WIDTH + "px",
        display: "block"
    }).html(waitHtml);

    $("#dlgoverlay").css("display", "block");
}

function hideWait() {
    $("#waitmsg").css("display", "none");
    $("#dlgoverlay").css("display", "none");
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
    var cookie = readCookie(COOKIE_NAME_AUTH);
    if (cookie) {
        var playerId = cookie.substr(0, cookie.indexOf(":"));
        ajaxGetPlayer(playerId, function() {
            if (callback) callback();
        });
    } else {
        document.location.href = "/index.html";
    }
}
function createUpdateAuthCookie() {
    createCookie(COOKIE_NAME_AUTH, window.player.PlayerId + ":" + window.player.AuthKey, 1);
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
    if (script) {
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
    } else {
        if (successCallback) successCallback();
    }
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

$(document).on("click", "#infolink", function() {
    showPhotoblurb();
}).on("click", ".photoblurb", function() {
    $("#infolink").trigger("click");
}).on("click", "#audiolink", function () {
    showVolSlider();
}).on("keyup", "#dlgoverlay", function (e) {
    e.stopPropagation();
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