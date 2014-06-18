var cvs = document.getElementById("mapcanvas"),
    mapLeft = 5,
    mapTop = 85,
    divLeft = 974,
    searchDir = "/content/images/search/",
    shipsDir = "/content/images/ships/",
    flagImg = "/content/images/usn-med.png",
    searchCursorImg = searchDir + "usn-airsearchcursor.png",
    captionColor = "usnblue",
    game = {},
    editsMade = false,
    side,
    phase = {},
    ships = [],
    shipZones = [],
    searches = [],
    airOps = [],
    lastShipSelected = null,
    selectedZone = "",
    selectedArea = "",
    //music and sfx
    soundInit = { formats: ["mp3", "ogg"], preload: true, autoplay: false, loop: false },
    soundInitLoop = { formats: ["mp3", "ogg"], preload: true, autoplay: false, loop: true },
    bgMusic,
    sfxArrived,
    sfxSailing,
    sfxAirSearch,
    audioVol,
    audioLoaded = false;

// Event handlers......................................................

$("#return").on("click", function() {
    if (editsMade) {
        var msg = "Are you sure you want to return to the home page without posting? Changes you've made will be lost.";
        showAlert("Return Home", msg, DLG_YESNO, "blue", function (choice) {
                if (choice == "Yes") goHome();
            });
    } else {
        goHome();
    }
});

$("#done").on("click", function () {
    if (!$(this).hasClass("disable")) {
        if (game.PhaseId == 1 && !allArrivalsOnMap()) {
            showAlert("End Phase", "All arriving ships must be brought on to the map.", DLG_OK, "red");
            return;
        }
        ajaxPutPhase(function () {
            loadUp();
        });
    }
});

$('#canvii').on("click", function (e) {
    e.stopPropagation();
    if (game.PhaseId == 1) {
        if (checkMoveShips(e)) return;
    } else if (game.PhaseId == 2) {
        if (checkSearching(e)) return;
    }
    // make the zone the 'current' one
    selectZone(windowToCanvas(cvs, e.clientX, e.clientY));
}).on("dblclick", function(e) {
    // select all ships in the zone (if any)
    var coords = windowToCanvas(cvs, e.clientX, e.clientY),
        zone = searchGrid.coordsToZone(coords);
    if ($.inArray(zone, shipZones) != -1) {
        $("#zone").find("div.shipitem").addClass("selected");
    }
    selectZoneTab();
    if (game.PhaseId == 1) showMoveHighlight();
});

// Event handlers for dynamically-loaded elements
$(document).on("click", ".tablistitem", function (e) {
    workTabs(e);
    if (game.PhaseId == 1) {
        $(".shipitem").removeClass("selected");
        showMoveHighlight();
    } else if (game.PhaseId == 2) {
        hideSearching();
    }
}).on("click", ".shipitem", function(e) {
    doShipSelection(this, (e.shiftKey));
});

// Functions...........................................................

/*-------------------------------------------------------------------*/
/* Return to the home page.                                          */
/*-------------------------------------------------------------------*/
function goHome() {
    navigateTo(bgMusic, "/views/home.html");
}

/*-------------------------------------------------------------------*/
/* Walk the array of sighting markers and draw each one.             */
/*-------------------------------------------------------------------*/
function drawSightings() {
    for (var i = 0; i < searches.length; i++) {
        for (var j = 0; j < searches[i].Markers.length; j++) {
            var zone = searches[i].Markers[j].Zone;
            var age = game.Turn - searches[i].Turn;
            searchGrid.drawSightingMarker(zone, age);
        }
    }
}

/*-------------------------------------------------------------------*/
/* Load the array of unique ship locations shipZones[], then walk it */
/* drawing a fleet marker at each location. If the excludedZones     */
/* array argument is populated, don't draw a marker at the locations */
/* it contains (used during movement).                               */
/*-------------------------------------------------------------------*/
function drawShips(excludedZones) {
    if (excludedZones == null) excludedZones = [];
    loadShipZones();
    for (var i = 0; i < shipZones.length; i++) {
        if ($.inArray(shipZones[i], excludedZones) == -1)
            searchGrid.drawShipsMarker(searchGrid.zoneToTopLeftCoords(shipZones[i]));
    }
}

/*-------------------------------------------------------------------*/
/* Mark the zone containing the input coordinates as the "current"   */
/* zone. If it contains ships, display them on the Zone tab.         */
/*-------------------------------------------------------------------*/
function selectZone(coords) {
    var topLeft = searchGrid.coordsToTopLeftCoords(coords);
    topLeft.x -= 3;
    topLeft.y -= 3;
    if (selectedZone) {
        var oldTopLeft = searchGrid.zoneToTopLeftCoords(selectedZone);
        oldTopLeft.x -= 3;
        oldTopLeft.y -= 3;
        searchGrid.removeZoneSelector(oldTopLeft.x, oldTopLeft.y);
    }
    searchGrid.drawSelector(topLeft, 1);
    selectedZone = searchGrid.coordsToZone(coords);
    showShipsInZone();
}

/*-------------------------------------------------------------------*/
/* Select the Zone tab in response to a double-click on a fleet      */
/* marker.                                                           */
/*-------------------------------------------------------------------*/
function selectZoneTab() {
    $(".tablistitem, .tabpanel").removeClass("tabshown");
    $("#zonetab").addClass("tabshown");
    $("#zone").addClass("tabshown");
}

/*-------------------------------------------------------------------*/
/* Mark the area containing the input coordinates as the "current"   */
/* area.                                                             */
/*-------------------------------------------------------------------*/
function selectArea(coords) {
    var topLeft = searchGrid.coordsToAreaTopLeftCoords(coords),
        area = searchGrid.coordsToZone(coords).substr(0, 2);
    deselectArea();
    topLeft.x = topLeft.x - 3;
    topLeft.y = topLeft.y - 3;
    searchGrid.drawSelector(topLeft, 3);
    selectedArea = area;
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function deselectArea() {
    if (selectedArea) {
        var oldTopLeft = searchGrid.zoneToTopLeftCoords(selectedArea + "A"),
            oldTop = oldTopLeft.y - 3,
            oldLeft = oldTopLeft.x - 3;
        searchGrid.removeAreaSelector(oldLeft, oldTop);
        selectedArea = "";
    }
}

/*-------------------------------------------------------------------*/
/* Load array of zones that contain player's ships.                  */
/*-------------------------------------------------------------------*/
function loadShipZones() {
    shipZones.length = 0;
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].ShipType != "BAS" && isNumber(ships[i].Location.substr(1, 1))) {
            if ($.inArray(ships[i].Location, shipZones) == -1) {
                shipZones.push(ships[i].Location);
            }
        }
    }
}

/*-------------------------------------------------------------------*/
/* Display on the Zone tab any ships in the currently selected zone. */
/*-------------------------------------------------------------------*/
function showShipsInZone() {
    if (!selectedZone) return;
    var zone = selectedZone == "H5G" ? "Midway" : selectedZone,
        shipsHtml = "<div style=\"margin: 5px; font-weight: bold;\">" + zone + "</div>",
        dblclick = "<div style=\"margin: 5px; font-size: .85em;\">Double-click to select all</div>",
        gotOwnShips = false,
        i;
    
    if (shipZones.length == 0) loadShipZones();

    // airbases
    var gotOne = false;
    for (i = 0; i < ships.length; i++) {
        if (ships[i].Location == selectedZone && ships[i].ShipType == "BAS") {
            shipsHtml += getShipListItemHtml(ships[i], false);
            gotOne = true;
        }
    }
    if (zone == "Midway" && !gotOne) {
        shipsHtml += "<li><div id=\"midway\" class=\"shipitem\"><img src=\"/content/images/midway.png\" draggable=\"false\"/></div></li>";
    }
    
    // sightings
    for (i = 0; i < searches.length; i++) {
        if (searches[i].Area == selectedZone.substr(0, 2) && searches[i].Markers.length) {
            for (var j = 0; j < searches[i].Markers.length; j++) {
                if (searches[i].Markers[j].Zone == selectedZone) {
                    shipsHtml += getSightedShipsHtml(searches[i].Markers[j], searches[i].Turn);
                }
            }
        }
    }
    // own ships
    shipsHtml += "<ul>";
    if ($.inArray(selectedZone, shipZones) != -1) {
        for (i = 0; i < ships.length; i++) {
            if (ships[i].Location == selectedZone && ships[i].ShipType != "BAS") {
                shipsHtml += getShipListItemHtml(ships[i], (game.PhaseId == 1));
                gotOwnShips = true;
            }
        }
    }
    shipsHtml += gotOwnShips ? "</ul>" + dblclick : "</ul>";
    $("#zone").html(shipsHtml);
    if (game.PhaseId == 1) showMoveHighlight();
}

/*-------------------------------------------------------------------*/
/* Display on the Due tab a list of the player's ships arriving in   */
/* the future.                                                       */
/*-------------------------------------------------------------------*/
function showShipsDue() {
    var arrivalTurn = 0,
        html = "<ul>";

    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "DUE") {
            if (ships[i].ArrivalTurn != arrivalTurn) {
                arrivalTurn = ships[i].ArrivalTurn;
                var dueDate = militaryDateTimeStr(gameTimeFromTurn(arrivalTurn), false),
                    turns = arrivalTurn - game.Turn,
                    turnsText = turns > 1 ? " (" + turns + " turns)" : " (next turn)";
                html += "</ul><div class=\"listheader\">Due " +
                    dueDate + turnsText + "</div><ul>";
            }
            html += getShipListItemHtml(ships[i], false);
        }
    }
    if (arrivalTurn == 0) {  // no ships due
        $("#duetab").css("color", "#808080");
        html = "<div style=\"margin: 5px;\">No future arrivals</div>";
    } else {
        $("#duetab").css("color", "#fff");
        html += "</ul>";
    }
    $("#due").html(html);
}

/*-------------------------------------------------------------------*/
/* Display on the Off tab any of the player's ships that have left   */
/* the map or been sunk.                                             */
/*-------------------------------------------------------------------*/
function showOffMapShips() {
    var html = "<ul>",
        gotOne = false;

    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "OFF" || ships[i].Location == "SNK") {
            html += getShipListItemHtml(ships[i], false);
            gotOne = true;
        }
    }
    if (!gotOne) { // no ships off map
        $("#offtab").css("color", "#808080");
        html = "<div style=\"margin: 5px;\">No ships off map</div>";
    } else {
        $("#offtab").css("color", "#fff");
        html += "</ul>";
    }
    $("#off").html(html);
}

/*-------------------------------------------------------------------*/
/* Build up and return the HTML for a single ship list item.         */
/*-------------------------------------------------------------------*/
function getShipListItemHtml(ship, showAvailMove) {
    var hitsDir = shipsDir + "hits/",
        idPrefix, shipId, availHits, readyClass, readyDesc, readyImg, hits;

    if (ship.ShipType == "BAS") {
        shipId = "airbase-" + ship.AirbaseId;
        availHits = ship.OriginalFortificationStrength;
        hits = ship.OriginalFortificationStrength - ship.FortificationStrength;
    } else {
        idPrefix = ship.Location == "ARR" ? "arrship-" : (ship.Location == "DUE" ? "dueship-" : "ship-");
        shipId = idPrefix + ship.ShipId;
        availHits = ship.HitsToSink;
        hits = ship.Hits;
    }
    var html = "<li><div id=\"" + shipId + "\" class=\"shipitem\"><img src=\"" + ship.ImagePath + "\"  draggable=\"false\"/>";

    if (showAvailMove) {
        if (ship.MovePoints > 0) {
            var some = " some-usn";
            if (side == "IJN") some = " some-ijn";
            html += "<div class=\"availmove" + some + "\"></div>";
        } else {
            html += "<div class=\"availmove none\"></div>";
        }
    }
    
    if (ship.ShipType == "CV" || ship.ShipType == "CVL" || ship.ShipType == "BAS") {
        readyDesc = ship.AircraftState == 0 ? "not ready" : (ship.AircraftState == 1 ? "readying" : "ready");
        readyClass = game.PhaseId == 1 ? " clickme" : "";
        readyImg = "<img src=\"/content/images/search/ready-" + ship.AircraftState + ".png\" />";
        html += "<div class=\"numplanes torpedo\">" + ship.TSquadrons + "</div>" +
            "<div class=\"numplanes fighter\">" + ship.FSquadrons + "</div>" +
            "<div class=\"numplanes divebomber\">" + ship.DSquadrons + "</div>" +
            "<div class=\"airreadiness" + readyClass + "\" title=\"Aircraft " + readyDesc + "\" id=\"ready-" + shipId + "\">" +
            readyImg + "</div>";
    }
    html += "<div class=\"shiphits green\"><img src=\"" + hitsDir + availHits + "-hitsgreen.png\"></div>";

    if (hits > 0) {
        html += "<div class=\"shiphits red\"><img src=\"" + hitsDir + hits + "-hitsred.png\"></div>";
    }
    
    return html + "</div></li>";
}
/*-------------------------------------------------------------------*/
/* Build up and return the HTML for enemy ship types found per the   */
/* input marker.                                                     */
/*-------------------------------------------------------------------*/
function getSightedShipsHtml(searchMarker, searchTurn) {
    var otherside = side == "USN" ? "ijn" : "usn",
        align = side == "USN" ? "left" : "right",
        turns = game.Turn - searchTurn,
        found = turns == 0 ? "this turn" : turns == 1 ? "last turn" : turns + " turns ago",
        html = "<table class=\"noselect\"><tr><td colspan=\"3\">Ship types sighted " + found +
            "</td></tr>",
        types = searchMarker.TypesFound.split(",");

    for (var i = 0; i < types.length; i++) {
        html += "<tr><td style=\"width: 20%;\"></td><td style=\"text-align: " + align + ";\" class=\"sightedship\">" +
            "<img src=\"" + shipsDir + otherside + types[i] + ".png\" /></td>" +
            "<td class=\"sightedlabel\">" + typeName(types[i]) + "</td></tr>";
    }
    return html + "</table>";
}
/*---------------------------------------------------------------------------*/
/* Return the unabbreviated form of the input ship type.             */
/*-------------------------------------------------------------------*/
function typeName(type) {
    switch (type) {
        case "BB":
            return "Battleship";
        case "CV":
            return "Carrier";
        case "CL":
            return "Light Cruiser";
        case "CVL":
            return "Light Carrier";
    }
    return "Cruiser";
}
/*---------------------------------------------------------------------------*/
/* Determine if the current turn is nighttime.                               */
/*---------------------------------------------------------------------------*/
function isNight() {
    var hour = gameTimeFromTurn(game.Turn).getHours();
    return (hour == 19 || hour == 0);
}
/*---------------------------------------------------------------------------*/
/* Build and return a list of members of the ships[] array that correspond   */
/* to the selections on the Arrivals or Zone tabs.                           */
/*---------------------------------------------------------------------------*/
function getSelectedShips(tabId) {
    var selShips = [],
        list = $("#" + tabId).find("div.shipitem.selected"),
        id;

    for (var i = 0; i < list.length; i++) {
        if (list[i].id.indexOf("airbase-") == -1) {
            id = list[i].id.substr(list[i].id.indexOf("-") + 1);
            selShips.push(getShipById(id));
        }
    }
    return selShips;
}

/*---------------------------------------------------------------------------*/
/* Build and return a list of members of the ships[] array that are in the   */
/* input zone.                                                               */
/*---------------------------------------------------------------------------*/
function getShipsInZone(zone) {
    var selShips = [];
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].ShipType != "BAS" && ships[i].Location == zone) {
            selShips.push(ships[i]);
        }
    }
    return selShips;
}

/*-------------------------------------------------------------------*/
/* Return the individual ships[] array element that has the input Id.*/
/*-------------------------------------------------------------------*/
function getShipById(id, isAirbase) {
    for (var i = 0; i < ships.length; i++) {
        if (isAirbase) {
            if (ships[i].AirbaseId == id)
                return ships[i];
        } else {
            if (ships[i].ShipId == id)
                return ships[i];
        }
    }
    return null;
}

/*-------------------------------------------------------------------*/
/* Respond to a click or Shift-click on a ship list item. Click      */
/* toggles selected state; Shift-click selects or deselects a range. */
/*-------------------------------------------------------------------*/
function doShipSelection(shipItem, shiftPressed) {
    if (!lastShipSelected) {
        $(shipItem).addClass("selected");
        lastShipSelected = shipItem;
    } else {
        if (shiftPressed) {
            var start = $(".shipitem").index(shipItem);
            var end = $(".shipitem").index(lastShipSelected);

            if ($(lastShipSelected).hasClass("selected")) {
                $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).addClass("selected");
            } else {
                $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).removeClass("selected");
            }
        } else {
            if ($(shipItem).hasClass("selected"))
                $(shipItem).removeClass("selected");
            else
                $(shipItem).addClass("selected");
        }
        lastShipSelected = shipItem;
    }
    if (game.PhaseId == 1) showMoveHighlight();
}

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
/* Make ajax call to load player's searches and their outcomes.      */
/*-------------------------------------------------------------------*/
function ajaxLoadSearches(successCallback) {
    $.ajax({
        url: "/api/search",
        type: "GET",
        data: { gameId: game.GameId, playerId: window.player.PlayerId },
        accepts: "application/json",
        success: function(data) {
            searches = JSON.parse(data);
            if (game.PhaseId == 3) splitOffOpponentSearches();
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
    var shipsToPass = [];

    if (game.PhaseId == 1) {
        // Ships can have their location changed, and carriers and airbases their aircraft ready state changed
        // (airbases are included in the local 'ships' collection)
        for (var i = 0; i < ships.length; i++) {
            if (ships[i].Location != "DUE" || (ships[i].ShipType == "CV" || ships[i].ShipType == "CVL"))
                shipsToPass.push(ships[i]);
        }
    }

    $.ajax({
        url: "/api/phase",
        type: "PUT",
        contentType: "application/json",
        accepts: "application/json",
        data: JSON.stringify({
            GameId: game.GameId,
            PlayerId: window.player.PlayerId,
            SelectedZone: selectedZone,
            Points: game.Points,
            Ships: shipsToPass,
            AirOps: airOps
        }),
        success: function(data) {
            window.player = JSON.parse(data);
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
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
        urls: [AUDIO_DIR_MUSIC + "home.ogg", AUDIO_DIR_MUSIC + "home.mp3"],
        autoplay: true,
        loop: true,
        volume: vol * 0.75
    });
    
    sfxSailing = new Howl({
        urls: [AUDIO_DIR_SFX + "ship-underway.ogg", AUDIO_DIR_SFX + "ship-underway.mp3"],
        autoplay: false,
        loop: true,
        volume: vol
    });

    sfxArrived = new Howl({
        urls: [AUDIO_DIR_SFX + "bosun-attn.ogg", AUDIO_DIR_SFX + "bosun-attn.mp3"],
        autoplay: false,
        volume: vol
    });

    sfxAirSearch = new Howl({
        urls: [AUDIO_DIR_SFX + "air-search.ogg", AUDIO_DIR_SFX + "air-search.mp3"],
        autoplay: false,
        loop: true,
        volume: vol
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
        var act = phase.Actions[i],
            actId = act.ActionKey.replace(" ", "").toLowerCase();
        tabHtml += "<li id=\"" + actId + "tab\" class=\"tablistitem" + showFirst + "\" title=\"" +
            act.Description + "\">" + act.ActionKey + "</li>";
        panelHtml += "<div id=\"" + actId + "\" class=\"tabpanel" + showFirst + "\"></div>";
        showFirst = "";
        
    }
    $("#tabs").html(tabHtml);
    $("#tabpanels").html(panelHtml);
}
/*-------------------------------------------------------------------*/
/* Callback for ajaxLoadShips call. Set up the various ships display */
/* elements, draw the search map and markers.                        */
/*-------------------------------------------------------------------*/
function shipsLoaded() {
    var wait = "";
    if (game.Waiting == "Y") {
        wait = " (waiting)";
        $("#done").addClass("disable");
    }

    var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
        " (Turn " + game.Turn + ") " + phase.Name + " Phase vs. " + (game.OpponentNickname || "?") + wait + "</span>";

    $("#gamedesc").addClass(captionColor).html("SEARCH MAP <img src=\"" + flagImg + "\" />" + gameStatus);
    $("#phasedescrip").addClass(captionColor).html(phase.Description);
    
    ajaxLoadSearches(function () {
        $("#searchdiv").css("display", "block");
        
        searchGrid.drawMap(function () {
            drawShips();
            drawSightings();

            if (selectedZone) {
                var coords = searchGrid.zoneToTopLeftCoords(selectedZone);
                coords.add(new Vector2D(-3, -3));
                searchGrid.drawSelector(coords, 1);
            }
            showShipsInZone(selectedZone);

            if (game.PhaseId == 1) loadMovePhase();
            else if (game.PhaseId == 2) loadSearchPhase();
            else if (game.PhaseId == 3) loadAirOpsPhase();
            else if (game.PhaseId == 5) loadAirDefensePhase();

            showShipsDue();
            showOffMapShips();
        });
    });
}
/*****************************************************************************/
/*****************************************************************************/
function loadPage(callback) {
    game = findGameById(getUrlParameter("gid"), window.player.Games);
    
    var scriptPath = "";
    if (game.PhaseId != 4)
        scriptPath = "/scripts/pages/search_phase_" + game.PhaseId.toString() + ".js";
    
    ajaxLoadScript(scriptPath, function() {
        side = game.SideShortName;

        if (side == "IJN") {
            // set up colors, images and layout for Japanese player
            mapLeft = 418;
            divLeft = 5;
            flagImg = "/content/images/ijn-med.png";
            searchCursorImg = searchDir + "ijn-airsearchcursor.png";
            captionColor = "ijnred";
            
            var html = "<img id=\"fleet\" class=\"searchmarker\" src=\"" + searchDir + "ijnfleet.png\" />" +
                "<img id=\"sighting\" class=\"searchmarker\" src=\"" + searchDir + "usnsighting.png\" />" +
                "<img id=\"enemyflag\" class=\"searchmarker\" src=\"/content/images/usn-med.png\" />";
            $("#imagecache").html(html);
            $("#fleetcursor").css("background", "url(" + searchDir + "ijnfleet.png) no-repeat left top");
            $("#dlgairops").css("background-color", "#610000");
            $("#opsimage").attr("src", searchDir + "ijnopspic.jpg");
        }
        if (isNight())
            $("#pagediv").css("background-image", "url(" + searchDir + "bg-searchnight.jpg)");
        
        ajaxLoadPhase(function () {
            setTabs();
            selectedZone = game.SelectedLocation || "H5G";

            $("#mapcanvas, #iconscanvas, #phasedescrip").css("left", mapLeft + "px");
            $("#searchdiv").css("left", divLeft + "px");
            if (game.PhaseId == 2)
                searchGrid.addCloudsCanvas();
            
            ajaxLoadShips(shipsLoaded);
        });
        window.currentPage = "search";
        if (callback) callback();
    });
}

/*---------------------------------------------------------------------------*/
/* Base page load function called at $(document).ready.                      */
/*---------------------------------------------------------------------------*/
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

// Initialize..................................................................
$(document).ready(function () {
    loadUp();
});
