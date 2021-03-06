﻿
var oppCleared = false,
    oppMatched = false,
    gamesPrepend,
    recordAppend,
    selGameId = 0,
    abandonables = [],
    twoWeeks = 1000 * 60 * 60 * 24 * 14,
    bgMusic,
    audioVol,
    nicknames = FuzzySet();
        
// Event handlers......................................................

$("#volinput").change(function() {
    $("#volvalue").text(this.value);
});
$("#logofflink").on("click", function () {
    if (unsavedRegChanges()) return;
    eraseCookie(COOKIE_NAME_AUTH);
    navigateTo(bgMusic, "/index.html");
});
$(".tablistitem").on("click", function (e) {
    workTabs(e);
});
$(document).on("mousedown", ".listitem", function (e) {
    selectGame(e.target);
}).on("mousedown", ".gameselimg", function(e) {
    selectGame(e.target.parentNode);
});
$("#quitgame").on("click", function() {
    var caption,
        msg = "Are you sure you want to abandon this game?",
        selGame = findGameById(selGameId, window.player.Games);
            
    if (abandonables[selGameId]) {
        caption = "Abandon Game";
        if (selGame.OpponentNickname && selGame.OpponentNickname.length)
            msg += " It will appear in the record as &ldquo;No Decision.&rdquo;";
        else
            msg += " It will not appear in the record.";
    } else {
        caption = "Retire";
        msg = msg.replace("abandon", "retire from") +
            " It will go into your record as a loss (and a win for your opponent).";
    }
    showAlert(caption, msg, DLG_YESNO, "blue", function(button) {
        if (button == "Yes") {
            var shallowPlayer = shallowCopyPlayer();
            shallowPlayer.Games.push(shallowCopyGame(selGame));

            shallowPlayer.Games[0].CompletedDTime = new Date().toISOString();
            if (abandonables[selGameId]) {
                shallowPlayer.Games[0].Draw = "Y";
            } else {
                shallowPlayer.Games[0].OpponentPoints = shallowPlayer.Games[0].Points + 1;
                shallowPlayer.Games[0].Draw = "N";
            }
            ajaxUpdatePlayer(shallowPlayer, updateSuccess); // will update game data for this page only

            function updateSuccess() {
                selGameId = 0;
                buildRecord();
                buildGameList();
                $("#quitgame").css("display", "none");
            }
        }
    });
});
$("#playgame").on("click", function () {
    if (selGameId == 0) return;
    if (unsavedRegChanges()) return;

    createGame(function () {
        navigateTo(bgMusic, "/views/search.html?gid=" + selGameId);
    });
});
$("#oppnickname")
    .on("focus", function () {
        if (!oppCleared) {
            $(this).val("");
            oppCleared = true;
        }
    })
    .on("blur", function () {
        if (!$(this).val()) {
            $(this).val("First available");
            oppCleared = false;
        }
    })
    .on("keyup", function (e) {
        if ($("#dlgoverlay").css("display") == "block") return;
    
        var oppselect = document.getElementById("oppselect");
        if ($(this).val()) {
            if (oppselect.length && e.keyCode == 40) {
                $(oppselect).focus();
            } else {
                var results = nicknames.get($(this).val());
                if (results == null || results.length > 10) {
                    closeOppSelect();
                    oppMatched = false;
                } else {
                    var selHtml = "";
                    for (var i = 0; i < results.length; i++) {
                        selHtml += "<option>" + results[i][1] + "</option>";
                    }
                    $(oppselect).attr("size", results.length).html(selHtml);
                    $("#oppselectdiv").css({ "display": "block" });
                }
                if (oppselect.length == 1 && !oppMatched) {
                    $(this).val($(oppselect).text());
                    setTimeout(function () {
                        closeOppSelect();
                        oppMatched = true;
                    }, 500);
                }
            }
        } else {
            closeOppSelect();
            oppMatched = false;
        }
    })
    .on("input", function () {
        if (!$(this).val()) {
            closeOppSelect();
            oppMatched = false;
        }
    });
$("#oppselect")
    .on("keyup", function(e) {
        if ($("#dlgoverlay").css("display") == "block") return;

        if (e.keyCode == 38 && $(this).prop("selectedIndex") == 0) {
            $("#oppnickname").focus();
        } else {
            var selText = $("#oppselect>option:selected").text();
            if (e.keyCode == 13 && selText) {
                $("#oppnickname").val(selText);
                closeOppSelect();
                oppMatched = true;
            }
        }
    })
    .on("click", function (e) {
        if (e.target) {
            $("#oppnickname").val($(e.target).val());
            closeOppSelect();
            oppMatched = true;
        }
    });
$(".regdata").on("input", function () {
    if (anyRegDataChanged()) {
        $("#canceledit").css("display", "inline-block");
    } else {
        $("#canceledit").css("display", "none");
    }
});
$("#canceledit").on("click", function() {
    loadRegFields();
    $(this).css("display", "none");
});
$("#saveedit").on("click", function () {
    saveRegData();
});
$("#cancelreg").on("click", function() {
    var msg = "<p>If you cancel your Midway registration, all your unfinished games will be forefeited, your " +
        "record will be lost, you will no longer be able to log on, and none of this can be undone.</p><p>Are you sure that " +
        "this is what you want to do?";
    
    showAlert("Cancel Registration", msg, DLG_YESNO, "red", function (resp) {
        if (resp == "Yes") {
            cancelRegistration(function () {
                eraseCookie(COOKIE_NAME_AUTH);
                location.replace("/index.html");
            });
        }
    });
});
$("#editreg").on("keyup", function(e) {
    if (e.keyCode == 13 && $("#saveedit").css("display") == "inline-block")
        $("#saveedit").trigger("click");
    else if (e.keyCode == 27 && $("#canceledit").css("display") == "inline-block")
        $("#canceledit").trigger("click");
});

// Functions...........................................................
        
function selectGame(gameItem) {
    $(".listitem").removeClass("down");
    $(gameItem).addClass("down");
    $("#playgame").css("display", "inline-block");
    selGameId = Number(gameItem.id.replace("game", ""));
    if (selGameId < 0) {
        $("#optopponent").slideDown();
        $("#quitgame").css("display", "none");
        setOppselectPos();
    } else {
        $("#optopponent").slideUp();
        $("#quitgame").css("display", "inline-block")
            .text(abandonables[selGameId] ? "Abandon" : "Retire");
    }
}

function shallowCopyPlayer() {
    return {
        playerId: window.player.PlayerId,
        Email: window.player.Email,
        Nickname: window.player.Nickname,
        Password: window.player.Password,
        Lockout: window.player.Lockout,
        Admin: window.player.Admin,
        Games: []
    };
}
        
function shallowCopyGame(game) {
    return {
        gameId: game.GameId,
        SideId: game.SideId,
        SideShortName: game.SideShortName,
        TinyFlagUrl: game.TinyFlagUrl,
        LastPlayed: game.LastPlayed,
        CompletedDTime: game.CompletedDTime,
        Points: game.Points,
        SelectedLocation: game.SelectedLocation,
        OpponentId: game.OpponentId,
        OpponentNickname: game.OpponentNickname,
        OpponentPoints: game.OpponentPoints,
        Draw: game.Draw,
        Waiting: game.Waiting
    };
}
        
// Return the Id of the newly-added game.
function getAddedGameId(gameIdsBefore) {
    var retId = 0,
        games = player.Games;

    for (var i = 0; i < games.length; i++) {
        if ($.inArray(games[i].GameId, gameIdsBefore) == -1) {
            retId = games[i].GameId;
            break;
        }
    }
    return retId;
}
        
function createGame(callback) {
    // create a new game if required
    if (selGameId < 0) {
        var nickname = "";
        if ($("#oppnickname").val() && $("#oppnickname").val() != "First available")
            nickname = $("#oppnickname").val();

        // build array of player's existing game Ids so we can find an added one.
        var gameIds = [];
        for (var i = 0; i < player.Games.length; i++) {
            gameIds.push(player.Games[i].GameId);
        }
        
       var shallowPlayer = shallowCopyPlayer();

        var game = {
            GameId: 0,
            Turn: 1,
            PhaseId: 1,
            SideId: Math.abs(selGameId),
            SideShortName: "",
            TinyFlagUrl: "",
            LastPlayed: "",
            CompletedDTime: "",
            Points: 0,
            SelectedLocation: "",
            OpponentId: 0,
            OpponentNickname: nickname,
            OpponentPoints: 0,
            Draw: "Y",
            Waiting: "N"
        };
        shallowPlayer.Games.push(game);

        // do a player update to create the new game
        ajaxUpdatePlayer(shallowPlayer, function() {
            // set the new game Id
            selGameId = getAddedGameId(gameIds);
            if (callback) callback();
        });
    } else {
        if (callback) callback();
    }
}
        
function unsavedRegChanges() {
    if ($("#canceledit").css("display") == "inline-block") {
        showAlert("Unsaved Changes", "You've made changes to your registration info that haven't been " +
            "saved. Please save or cancel them.", DLG_OK, "blue");
        $(".tablistitem, .tabpanel").removeClass("tabshown");
        $("#editregtab, #editreg").addClass("tabshown");
        return true;
    }
    return false;
}
        
function saveRegData() {
    var caption = "", msg = "";

    if (anyRegDataChanged()) {
        if (!validEmail("email")) {
            caption = "Invalid Email";
            msg = "The email address you've entered isn't actually an email address.";
        } else if ($("#pwd").val() == "") {
            caption = "Invalid Password";
            msg = "You apparently don't care about your security, but we do. You must provide a password!";     
        } else if ($("#pwd").val() != window.player.Password && $("#pwd").val() != $("#pwd2").val()) {
            caption = "Passwords Don't Match";
            msg = "The password you've entered is not the same as the one you've ostensibly confirmed.";
        } else if ($("#nickname").val() != window.player.Nickname) {
            if ($("#nickname").val() == "") {
                caption = "Missing Nickname";
                msg = "We don't share email addresses, so you must provide a nickname. Otherwise, we " +
                    " won't know what to call you!";
            } else if ($("#nickname").val().toLowerCase() == "first available") {
                caption = "Invalid Nickname";
                msg = "You trying to be funny? That'll thoroughly screw up the way the nickname search works.";
            }
        }
        if (msg) {
            showAlert(caption, msg, DLG_OK, "blue");
        } else {
            var shallowPlayer = {
                playerId: window.player.PlayerId,
                Email: $("#email").val(),
                Nickname: $("#nickname").val(),
                Password: $("#pwd").val(),
                Lockout: window.player.Lockout,
                Admin: window.player.Admin,
                Games: []
            };
            ajaxUpdatePlayer(shallowPlayer, function() {
                loadRegFields();
                $("#canceledit").css("display", "none");
                $("#namespan").text(window.player.Nickname);
                showAlert("Save", "Changes saved.", DLG_OK, "blue");
            });
        }
    }
}
        
function anyRegDataChanged() {
    if ($("#email").val().toLowerCase() != window.player.Email.toLowerCase())
        return true;
    if ($("#pwd").val() != window.player.Password)
        return true;
    if ($("#nickname").val() != window.player.Nickname)
        return true;

    return false;
}
        
function loadRegFields() {
    $("#email").val(window.player.Email);
    $("#pwd").val(window.player.Password);
    $("#pwd2").val(window.player.Password);
    $("#nickname").val(window.player.Nickname);
}

/*-------------------------------------------------------*/
/* Delete this player and his/her games from the system. */
/*-------------------------------------------------------*/
function cancelRegistration(successCallback) {
    $.ajax({
        url: "/api/player/" + player.PlayerId,
        type: "DELETE",
        success: function () {
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

/*-------------------------------------------------------*/
/* Build up html for one game for the 'Your Games' list. */
/*-------------------------------------------------------*/
function getGameListItem(game) {
    var itemStart = "<li id=\"game" + game.GameId + "\" class=\"listitem\"",
        title, oppName, icon, waiting;
            
    if (game.Waiting == "Y") {
        icon = "<img src=\"/content/images/booblite-red.png\" class=\"gameselimage\" />";
        waiting = " (waiting for opponent to post)";
    } else if (game.OppWaiting == "Y") {
        icon = "<img src=\"/content/images/booblite!-green.png\" class=\"gameselimage\" />";
        waiting = " (waiting for you to post)";
    } else {
        icon = "<img src=\"/content/images/booblite-green.png\" class=\"gameselimage\" />";
        waiting = "";
    }
    if (game.OpponentNickname == null || game.OpponentNickname == "") {
        oppName = "?";
        title = " title=\"No opponent yet " + waiting;
        abandonables[game.GameId] = true;
    } else {
        oppName = game.OpponentNickname;
        if (game.LastPlayed) {
            var lp = parseIso8601(game.LastPlayed),
                dn = parseIso8601(game.DTimeNow);
            title = " title=\"Posted to server " + prettyTimeAgo(lp, dn) + waiting;

            // Games more than two weeks old can be abandoned; 
            // if less, to quit one must retire and take a loss.
            abandonables[game.GameId] =
                (dn.getTime() - lp.getTime() > twoWeeks);
        } else {
            title = " title=\"Not started";
            abandonables[game.GameId] = true;
        }
    }
    var html = itemStart + title + "\"><img src=\"" + game.TinyFlagUrl + "\" class=\"gameselimage\" />" +
        game.SideShortName + " vs. " + oppName + icon + "Turn " + game.Turn + " " + game.PhaseName + "</li>";
    return html;
}
/*----------------------------------------------------*/
/* Get html for each of the player's incomplete games */
/* for the 'Your Games' list, and display it.         */
/*----------------------------------------------------*/
function buildGameList() {
    var listHtml = "";
    if (gamesPrepend) gamesPrepend.remove();
            
    if (window.player.Games) {
        for (var i = 0; i < window.player.Games.length; i++) {
            if (window.player.Games[i].CompletedDTime == null || window.player.Games[i].CompletedDTime == "") {
                listHtml += getGameListItem(window.player.Games[i]);
            }
        }
        gamesPrepend = $(listHtml).prependTo("#gamelist ul");
    }
}
/*----------------------------------------------------*/
/* Calc the location and width of the opponent search */
/* select based on the opponent nickname text input.  */
/*----------------------------------------------------*/
function setOppselectPos() {
    var oppnickname = document.getElementById("oppnickname");
    var oTop = oppnickname.offsetTop + oppnickname.offsetHeight + 12;
    var oLeft = oppnickname.offsetLeft;
    var oWidth = oppnickname.offsetWidth;
    $("#oppselectdiv").css({ "left": oLeft + "px", "top": oTop + "px" });
    $("#oppselect").css("width", oWidth + "px");
}
/*------------------------------------------------*/
/* Clear out and hide the nickname search select. */
/*------------------------------------------------*/
function closeOppSelect() {
    $("#oppselect").html("");
    $("#oppselectdiv").css("display", "none");
    $("#oppnickname").focus();
}
/*----------------------------------------------*/
/* Get a list of all players' nicknames for the */
/* new game optional opponent search/select.    */
/*----------------------------------------------*/
function getPlayers() {
    ajaxGetPlayers(gotPlayers);

    function gotPlayers(list) {
        for (var i = 0; i < list.length; i++) {
            if (list[i].Nickname != window.player.Nickname) {
                nicknames.add(list[i].Nickname);
            }
        }
    }
}
/*--------------------------------------------------------------*/
/* Build up the player's won-lost record from  his or her games */
/* and display it in a table on the 'Your Record' tab.          */
/*--------------------------------------------------------------*/
function buildRecord() {
    var record = [],
        recIndex,
        html = "";
            
    // build table of game outcomes
    if (recordAppend) recordAppend.remove();
    for (var i = 0; i < window.player.Games.length; i++) {
        var game = window.player.Games[i];
                
        if (game.CompletedDTime != "" && game.OpponentNickname) {
            recIndex = -1;
            for (var j = 0; j < record.length; j++) {
                if (game.OpponentNickname == record[j][0]) {
                    recIndex = j;
                    break;
                }
            }
            if (recIndex == -1) {
                recIndex = record.push([game.OpponentNickname, 0, 0, 0]) - 1;
            }
            if (game.Draw == "Y") {     //abandoned or retired from
                record[recIndex][3]++;
            } else if (game.Points < game.OpponentPoints) {
                record[recIndex][2]++;
            } else {
                record[recIndex][1]++;
            }
        }
    }
            
    // display the table
    for (i = 0; i < record.length; i++) {
        html += "<tr><td class='name'>" + record[i][0] + "</td><td class='number'>" + record[i][1] +
            "</td><td class='number'>" + record[i][2] + "</td><td class='number'>" + record[i][3] +
            "</td></tr>";
    }
    recordAppend = $(html).appendTo("#recordtable");
}
        
// Init................................................................

$(document).ready(function () {
    audioVol = readCookie(COOKIE_NAME_AUDIO) || 50;
    console.log("home page volume: " + audioVol);
    $("#volinput").slider({
        orientation: "vertical",
        value: audioVol,
        slide: function (e, ui) {
            audioVol = ui.value;
            $("#volvalue").text(audioVol);
            if (bgMusic) bgMusic.volume(audioVol * 0.01);
            createCookie(COOKIE_NAME_AUDIO, audioVol, 1000);
        }
    });
    $("#volvalue").text($("#volinput").slider("value"));

    bgMusic = new Howl({
        urls: [AUDIO_DIR_MUSIC + "home.ogg", AUDIO_DIR_MUSIC + "home.mp3"],
        loop: true,
        autoplay: false
    });
    if (bgMusic) {
        if (audioVol > 0) {
            bgMusic.play().fade(0, audioVol * 0.01, 1000);
        }
    }
    
    loadPlayerForPage(function() {
        $("#namespan").text(window.player.Nickname);

        $("#homediv").draggable({
            handle: ".floathead",
            containment: "#pagediv",
            scroll: false
        });
        
        loadRegFields();
        buildRecord();
        buildGameList();
        getPlayers();
       
        window.currentPage = "home";
    });
});

