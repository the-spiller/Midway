var cvs = document.getElementById("mapcanvas"),
    mapLeft = 5,
    mapTop = 85,
    divLeft = 974,
    flagImg = "/content/images/usn-med.png",
    captionColor = "usnblue",
    game = {},
    editsMade = false,
    side = "",
    //music and sfx
    soundInit = { formats: ["mp3", "ogg"], preload: true, autoplay: false, loop: false },
    soundInitLoop = { formats: ["mp3", "ogg"], preload: true, autoplay: false, loop: true },
    bgMusic,
    audioVol,
    audioLoaded = false;

// Event handlers......................................................

$("#return").on("click", function() {
    if (editsMade) {
        showAlert("Return Home",
            "Are you sure you want to return to the search map page without posting? Changes you've made will be lost.",
            DLG_YESCANCEL, "blue", function (choice) {
                if (choice == "Yes") goHome();
            });
    } else {
        navigateTo(bgMusic, "/views/search.html");
    }
});

$("#done").on("click", function () {
    if (!$(this).hasClass("disable")) {

    }
});

/*-------------------------------------------------------------------*/
/* Make ajax call to load phase data in this game.                   */
/*-------------------------------------------------------------------*/
function ajaxLoadPhase(successCallback) {
    $.ajax({
        url: "/api/phase/" + game.PhaseId,
        type: "GET",
        accepts: "application/json",
        success: function(data) {
            createUpdateAuthCookie(); 
            phase = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

/*-------------------------------------------------------------------*/
/* Make ajax call to load player's ships in this game.               */
/*-------------------------------------------------------------------*/
function ajaxLoadShips(successCallback) {
    $.ajax({
        url: "/api/ship",
        type: "GET",
        data: { playerId: window.player.PlayerId, gameId: game.GameId },
        accepts: "application/json",
        success: function(data) {
            createUpdateAuthCookie();
            ships = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

/*-------------------------------------------------------------------*/
/* Make ajax call to post phase data back to the server.             */
/*-------------------------------------------------------------------*/
function ajaxPutPhase(successCallback) {
}
/*-------------------------------------------------------------------*/
/* Set the volume on all playing tracks in response to a change.     */
/*-------------------------------------------------------------------*/
function setVolume(vol) {
    if (bgMusic) bgMusic.volume(vol * 0.75);
    if (sfxSailing) sfxSailing.volume(vol);
    if (sfxAirSearch) sfxAirSearch.volume(vol);
}

/*-------------------------------------------------------------------*/
/* Load search map audio based on game phase                         */
/*-------------------------------------------------------------------*/
function loadAudio() {
    if (audioLoaded) return;
    
    window.audioVol = readCookie(COOKIE_NAME_AUDIO) || 50;
    console.log("search page volume: " + audioVol);
    var vol = audioVol * 0.01;
    
    $("#volinput").slider({
        orientation: "vertical",
        value: audioVol,
        slide: function (e, ui) {
            audioVol = ui.value;
            $("#volvalue").text(audioVol);
            setVolume(audioVol * 0.01);
            createCookie(COOKIE_NAME_AUDIO, audioVol, 1000);
        }
    });
    $("#volvalue").text($("#volinput").slider("value"));

    bgMusic = new Howl({
        urls: [AUDIO_DIR_MUSIC + "search.ogg", AUDIO_DIR_MUSIC + "search.mp3"],
        autoplay: true,
        loop: true,
        volume: vol * 0.75
    });
    audioLoaded = true;
}

/*-------------------------------------------------------------------*/
/* Callback for ajaxLoadPhase call. Set up tabs based on phase       */
/* actions.                                                          */
/*-------------------------------------------------------------------*/
function setTabs() {
    var tabHtml = "",
        panelHtml = "",
        showFirst = " tabshown";
    
    for (var i = 0; i < phase.Actions.length; i++) {
        var act = phase.Actions[i];
        tabHtml += "<li id=\"" + act.ActionKey.toLowerCase() + "tab\" class=\"tablistitem" + showFirst + "\" title=\"" +
            act.Description + "\">" + act.ActionKey + "</li>";
        panelHtml += "<div id=\"" + act.ActionKey.toLowerCase() + "\" class=\"tabpanel" + showFirst + "\"></div>";
        showFirst = "";
        
    }
    $("#tabs").html(tabHtml);
    $("#tabpanels").html(panelHtml);
}
/*****************************************************************************/
/* Base page load function called at $(document).ready.                      */
/*****************************************************************************/
function loadPage(callback) {
    game = findGameById(getUrlParameter("gid"), window.player.Games);
    
    var scriptPath = "";
    if (game.PhaseId != 4)
        scriptPath = "/scripts/pages/search_phase_" + game.PhaseId.toString() + ".js";
    
    ajaxLoadScript(scriptPath, function() {
        side = game.SideShortName;

        if (side == "IJN") {
            mapLeft = 418;
            divLeft = 5;
            flagImg = "/content/images/ijn-med.png";
            captionColor = "ijnred";
            
            $("#fleetcursor").css("background", "url(" + searchDir + "ijnfleet.png) no-repeat left top");
            $("#dlgairops").css("background-color", "#610000");
            $("#opsimage").attr("src", searchDir + "ijnopspic.jpg");
        }
        if (isNight())
            $("#pagediv").css("background-image", "url(" + searchDir + "bg-searchnight.jpg)");
        
        ajaxLoadPhase(function () {
            setTabs();

            $("#mapcanvas, #iconscanvas, #phasedescrip").css("left", mapLeft + "px");
            $("#battlediv").css("left", divLeft + "px");
            if (game.PhaseId == 2)
                searchGrid.addCloudsCanvas();
            
            ajaxLoadShips(shipsLoaded);
        });
        
        var wait = "";
        if (game.Waiting == "Y") {
            wait = " (waiting)";
            $("#done").addClass("disable");
        }

        var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
            " (Turn " + game.Turn + ") " + phase.Name + " Phase vs. " + (game.OpponentNickname || "?") + wait + "</span>";

        $("#gamedesc").addClass(captionColor).html("SEARCH MAP <img src=\"" + flagImg + "\" />" + gameStatus);
        $("#phasedescrip").addClass(captionColor).html(phase.Description);
        
        window.currentPage = "battle";
        if (callback) callback();
    });
}

function loadUp() {
    loadPlayerForPage(function () {
        loadPage(function () {
            loadAudio();
            $("#canvii").css("visibility", "visible");
            editsMade = false;
            if (game.PhaseId == 2) scrollClouds();
        });
    });
}
// Initialize..........................................................

$(document).ready(function () {
    loadUp();
});
