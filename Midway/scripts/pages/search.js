var canvas = document.getElementById("searchcanvas"),
    mapLeft = 5,
    divLeft = 974,
    imgDir = "/content/images/search/",
    bgImg = imgDir + "bg-search.jpg",
    flagImg = "/content/images/usn-med.png",
    mapImg = null,
    captionColor = "usnblue",
    game = {},
    dirty = false,
    mouseDown = false,
    side,
    phase = {},
    ships = [],
    shipZones = [],
    searches = [],
    lastShipSelected = null,
    selectedZone = "",
    selectedArea = "",
    dragThang = {
        dragging: false,
        origin: "",
        dragData: null,
        cursorImg: null,
        cursorOffset: { x: 0, y: 0 },
        useSnapshot: false,
        snapshot: null
    };

// Event handlers......................................................

$("#return").on("click", function() {
    if (dirty) {
        showAlert("Home",
            "Are you sure you want to return to the home page without posting? Changes you've made will be lost.",
            DLG_YESCANCEL, "blue", returnChoice);

        function returnChoice(choice) {
            if (choice == "Yes") goHome();
        }
    } else {
        goHome();
    }
});
$("#done").on("click", function() {
    if (!$(this).hasClass("disable")) {
        if (game.PhaseId == 1 && !allArrivalsOnMap()) {
            showAlert("End Phase", "All arriving ships must be brought on to the map.", DLG_OK, "red");
            return;
        }
        ajaxPutPhase(function () {
            location.reload(true);
        });
    }
});

$(canvas).on("click", function (e) {
    // make the zone the 'current' one
    selectZone(windowToCanvas(canvas, e.clientX, e.clientY));
}).on("dblclick", function (e) {
    // select all ships in the zone (if any)
    var coords = windowToCanvas(canvas, e.clientX, e.clientY),
        zone = searchGrid.coordsToZone(coords);
    if ($.inArray(zone, shipZones) != -1) {
        $("#zone").find("div.shipitem").addClass("selected");
    }
    selectZoneTab();
}).on("mouseup", function (e) {
    canvasMouseUp(e);
}).on("mouseout", function () {
    mouseDown = false;
    if (dragThang.dragging) {
        dragThang.dragging = false;
        if (dragThang.useSnapshot)
            searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
    }
});

// Event handlers for dynamically-loaded elements
$(document).on("click", ".tablistitem", function(e) {
    workTabs(e);
}).on("click", ".shipitem", function(e) {
    doShipSelection(this, (e.shiftKey));
    mouseDown = false;
});

// Functions...........................................................

/*-------------------------------------------------------------------*/
/* Return to the home page.                                          */
/*-------------------------------------------------------------------*/
function goHome() {
    location.replace("/views/home.html");
}

/*-------------------------------------------------------------------*/
/* Walk the array of sighting markers and draw each one.             */
/*-------------------------------------------------------------------*/
function drawSightings() {
    for (var i = 0; i < searches.length; i++) {
        for (var j = 0; j < searches[i].Markers.length; j++) {
            searchGrid.drawSightingMarker(searches[i].Markers[j].Zone);
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
    var topLeft = addVectors(searchGrid.coordsToTopLeftCoords(coords), { x: -3, y: -3 });
    if (selectedZone) {
        var oldTopLeft = searchGrid.zoneToTopLeftCoords(selectedZone),
            oldTop = oldTopLeft.y - 3,
            oldLeft = oldTopLeft.x - 3;
        searchGrid.removeSelector(oldLeft, oldTop);
    }
    searchGrid.drawSelector(topLeft, 1, true);
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
    var zone = searchGrid.coordsToZone(coords);
    if (zone) {
        var area = zone.substr(0, 2);
        var topLeftCoords = addVectors(searchGrid.zoneToTopLeftCoords(area + "A"), { x: -3, y: -3 });
        searchGrid.drawSelector(topLeftCoords, 3);
        selectedArea = area;
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

    var zone = selectedZone;
    if (zone == "H5G") zone = "Midway";
    var html = "<div style=\"margin: 5px; font-weight: bold;\">" + zone + "</div>",
        i;
    if (shipZones.length == 0) loadShipZones();

    // sightings
    for (i = 0; i < searches.length; i++) {
        if (searches[i].Area == selectedZone.substr(0, 2) && searches[i].Markers.length) {
            for (var j = 0; j < searches[i].Markers.length; j++) {
                if (searches[i].Markers[j].Zone == selectedZone) {
                    html += getSightedShipsHtml(searches[i].Markers[j], searches[i].Turn);
                }
            }
        }
    }
    // own ships
    html += "<ul>";
    if ($.inArray(selectedZone, shipZones) != -1) {
        for (i = 0; i < ships.length; i++) {
            if (ships[i].Location == selectedZone) {
                html += getShipListItemHtml(ships[i]);
            }
        }
    }
    // airbases
    for (i = 0; i < ships.length; i++) {
        if (ships[i].Location == selectedZone && ships[i].ShipType == "BAS") {
            html += getShipListItemHtml(ships[i]);
        }
    }
    $("#zone").html(html + "</ul>");
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
                var dueDate = militaryDateTimeStr(gameTimeFromTurn(arrivalTurn), false);
                var turns = arrivalTurn - game.Turn;
                html += "</ul><div class=\"listheader\">Due " +
                    dueDate + " (" + turns + " turns)</div><ul>";
            }
            html += getShipListItemHtml(ships[i]);
        }
    }
    if (arrivalTurn == 0) // no ships due
        html = "<div style=\"margin: 5px;\">No future arrivals</div>";
    else
        html += "</ul>";

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
            html += getShipListItemHtml(ships[i]);
            gotOne = true;
        }
    }
    if (!gotOne)    // no ships off map
        html = "<div style=\"margin: 5px;\">No ships off map</div>";
    else
        html += "</ul>";

    $("#off").html(html);
}

/*-------------------------------------------------------------------*/
/* Build up and return the HTML for a single ship list item.         */
/*-------------------------------------------------------------------*/
function getShipListItemHtml(ship) {
    var hitsDir = imgDir + "ships/hits/",
        idPrefix, shipId, imgSuffix, availHits, hits;

    if (ship.ShipType == "BAS") {
        shipId = "airbase-" + ship.AirbaseId;
        imgSuffix = ".png";
        availHits = ship.OriginalFortificationStrength;
        hits = ship.OriginalFortificationStrength - ship.FortificationStrength;
    } else {
        idPrefix = ship.Location == "ARR" ? "arrship-" : (ship.Location == "DUE" ? "dueship-" : "ship-");
        shipId = idPrefix + ship.ShipId;
        imgSuffix = "";
        availHits = ship.HitsToSink;
        hits = ship.Hits;
    }
    var html = "<li><div id=\"" + shipId + "\" class=\"noselect shipitem\"><img src=\"" +
        ship.SearchImgPath + imgSuffix + "\"  draggable=\"false\"/>";

    if (ship.ShipType == "CV" || ship.ShipType == "CVL" || ship.ShipType == "BAS") {
        html += "<div class=\"numplanes torpedo\">" + ship.TSquadrons +
            "</div><div class=\"numplanes fighter\">" + ship.FSquadrons +
            "</div><div class=\"numplanes divebomber\">" + ship.DSquadrons + "</div>";
    }
    html += "<div class=\"shiphits green\"><img src=\"" + hitsDir + availHits + "-hitsgreen.png\"></div>";

    if (hits > 0) {
        html += "<div class=\"shiphits red\"><img src=\"" + hitsDir + hits + "-hitsred.png\"></div></div></li>";
    }
    return html;
}

/*-------------------------------------------------------------------*/
/* Display on the Zone tab enemy ship types found in a zone.         */
/*-------------------------------------------------------------------*/
function getSightedShipsHtml(searchMarker, searchTurn) {
    var otherside = side == "USN" ? "ijn" : "usn",
        turns = game.Turn - searchTurn,
        found = turns == 0 ? "this turn" : turns == 1 ? "a turn ago" : turns + " turns ago",
        html = "<table class=\"noselect\"><tr><td colspan=\"2\">Ship types sighted (" + found + ")</td></tr>",
        types = searchMarker.TypesFound.split(",");

    for (var i = 0; i < types.length; i++) {
        html += "<tr><td class=\"sightedlabel\">" + types[i] + "</td><td class=\"sightedship\">" +
            "<img src=\"" + imgDir + otherside + types[i] + ".png\" /></td></tr>";
    }
    return html + "</table>";
}

/*-------------------------------------------------------------------*/
/* Display image indicating air readiness.                           */
/*-------------------------------------------------------------------*/
function showAirReadiness() {
    var imgElement = document.getElementById("readinessimg"),
        readyDesc;
    
    switch (game.AircraftReadyState) {
    case 0:
        imgElement.src = imgDir + "air-notready.png";
        readyDesc = "not ready";
        break;
    case 1:
        imgElement.src = imgDir + "air-readying.png";
        readyDesc = "readying";
        break;
    default:
        imgElement.src = imgDir + "air-ready.png";
        readyDesc = "ready";
        break;
    }
    if (game.PhaseId > 1)
        $("#airreadiness").prop("title", "Aircraft " + readyDesc).addClass("disable");
}

/*-------------------------------------------------------------------*/
/* Build and return a list of members of the ships[] array that      */
/* correspond to the selections on the Arrivals or Zone tabs.        */
/*-------------------------------------------------------------------*/
function getSelectedShips(tabId) {
    var selShips = [],
        list = $("#" + tabId).find("div.shipitem.selected"),
        id;

    for (var i = 0; i < list.length; i++) {
        if (list[i].id.indexOf("airbase-") == -1) {
            id = list[i].id.substr(list[i].id.indexOf("-") + 1);
            console.log(id);
            selShips.push(getShipById(id));
        }
    }
    return selShips;
}

/*-------------------------------------------------------------------*/
/* Return the individual ships[] array element that has the input Id.*/
/*-------------------------------------------------------------------*/
function getShipById(id) {
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].ShipId == id) {
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
        return;
    }
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

/*-------------------------------------------------------------------*/
/* Called after a fast timer to ensure that we're actually dragging. */
/*-------------------------------------------------------------------*/
function beginControlsDrag() {
    if (mouseDown) {
        dragThang.dragging = true;
        canvas.addEventListener("mousemove", canvasMouseMove, false);
    }
}

/*-------------------------------------------------------------------*/
/* Respond to mouse movement during drag. If drag is just starting,  */
/* capture canvas image, otherwise restore canvas image captured at  */
/* start of drag. Draw element being dragged at new mouse coordinates.*/
/*-------------------------------------------------------------------*/
function canvasMouseMove(e) {
    if (dragThang.dragging) {
        var canvasCoords = windowToCanvas(canvas, e.clientX, e.clientY);
        if (dragThang.origin == "search") {
            showSearching(canvasCoords);
        } else {
            if (dragThang.useSnapshot) {
                if (dragThang.snapshot) {
                    searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
                } else {
                    dragThang.snapshot = searchGrid.grabImageData();
                }
            }
            if (isLegitDrop(canvasCoords)) {
                if (dragThang.origin == "arrivals") {
                    var topLeft = searchGrid.coordsToTopLeftCoords(canvasCoords);
                    searchGrid.drawShipsMarker(topLeft);
                } else {
                    // a zone -- movement
                    searchGrid.drawMoveBand(dragThang.origin, canvasCoords);
                }
            }
        }
    }
}

/*-------------------------------------------------------------------*/
/* Respond to a potiential drop event.                               */
/*-------------------------------------------------------------------*/
function canvasMouseUp(e) {
    mouseDown = false;
    if (dragThang.dragging) {
        dragThang.dragging = false;
        canvas.removeEventListener("mousemove", canvasMouseMove, false);

        var coords = windowToCanvas(canvas, e.clientX, e.clientY),
            zone = searchGrid.coordsToZone(coords);
        
        if (dragThang.origin == "search") {
            hideSearching();
            selectArea(coords);
            executeSearch(coords, zone, dragThang.dragData, function() {
                searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
                drawSightings();
            });
        } else if (isLegitDrop(coords)) {
            var cost = 0;

            if (isNumber(dragThang.origin.substr(1, 1)))
                cost = searchGrid.zoneDistance(dragThang.origin, zone);

            relocateShips(zone, dragThang.dragData, cost);

            if (dragThang.origin == "arrivals") {
                //searchGrid.drawShipsMarker(searchGrid.coordsToTopLeftCoords(coords));
                $("#arrivals").find("div.shipitem").remove(".selected").parent();
                selectZone(coords);
                if ($("#arrivals").find("div.shipitem").length == 0) {
                    $("#zonetab").trigger("click");
                }
            } else {
                //movement's done
                sailShips(dragThang.origin, zone);
            }
            window.dirty = true;
        }
    }
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
/* Make ajax call to load player's search markers in this game.      */
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
    // parse out future arrivals
    var shipsToPass = [];
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location != "DUE")
            shipsToPass.push(ships[i]);
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
            AirReadiness: game.AircraftReadyState,
            Points: game.Points,
            Ships: shipsToPass,
            Searches: searches
        }),
        success: function(data) {
            window.player = JSON.parse(data);
            //createUpdateAuthCookie();
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
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
        if (game.Waiting == "N" || act.AvailWhenWaiting == "Y") {
            tabHtml += "<li id=\"" + act.ActionKey.toLowerCase() + "tab\" class=\"tablistitem" + showFirst + "\" title=\"" +
                act.Description + "\">" + act.ActionKey + "</li>";
            panelHtml += "<div id=\"" + act.ActionKey.toLowerCase() + "\" class=\"tabpanel" + showFirst + "\"></div>";
            showFirst = "";
        }
    }
    $("#tabs").html(tabHtml);
    $("#tabpanels").html(panelHtml);
}

/*-------------------------------------------------------------------*/
/* Callback for ajaxLoadShips call. Set up the various ships display */
/* elements, draw the search map and markers.                        */
/*-------------------------------------------------------------------*/
function shipsLoaded() {
    $("#searchcanvas").css("left", mapLeft + "px");
    $("#searchdiv").css("left", divLeft + "px").draggable({
        handle: ".floathead",
        containment: "#pagediv",
        scroll: false
    });
    $("#return").css("left", "1330px");

    var wait = "";
    if (game.Waiting == "Y") {
        wait = " (waiting)";
        $("#done").addClass("disable");
    }

    var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
        " vs. " + (game.OpponentNickname || "?") +
        " - <span id=\"phase\" title=\"" + phase.Description + "\">" + phase.Name + " Phase</span>" + wait + "</span>";
    $("#gamedesc").addClass(captionColor).html("SEARCH MAP <img src=\"" + flagImg + "\" />" + gameStatus);

    $("#pagediv").css({ "background-image": "url(\"" + bgImg + "\")", "background-repeat": "repeat" });

    if (game.PhaseId == 1 && game.AircraftReadyState == 1)
        game.AircraftReadyState = 2;
    showAirReadiness();

    ajaxLoadSearches(function() {
        searchGrid.drawMap(function () {
            if (game.PhaseId == 1) searchGrid.highlightArrivalZones(side);
            drawShips();
            drawSightings();

            if (selectedZone) {
                var coords = addVectors(searchGrid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 });
                searchGrid.drawSelector(coords, 1);
            }
            showShipsInZone(selectedZone);
            loadPhaseTab();
            showShipsDue();
            showOffMapShips();
        });
    });
}
/*****************************************************************************/
/* Base page load function called at $(document).ready and after posting     */
/* completed phase to server.                                                */
/*****************************************************************************/
function loadPage() {
    game = findGameById(getUrlParameter("gid"), window.player.Games);
    var scriptPath = "/scripts/pages/search_phase_" + game.PhaseId.toString() + ".js";
    ajaxLoadScript(scriptPath, function() {
        side = game.SideShortName;

        if (side == "IJN") {
            mapLeft = 418;
            divLeft = 5;
            flagImg = "/content/images/ijn-med.png";
            captionColor = "ijnred";
            var html = "<img id=\"fleet\" class=\"searchmarker\" src=\"" + imgDir + "ijnfleet.png\" />" +
                "<img id=\"sighting\" class=\"searchmarker\" src=\"" + imgDir + "usnsighting.png\" />" +
                "<img id=\"airsearchcursor\" class=\"cursorimg\" src=\"" + imgDir + "ijn-airsearchcursor.png\" />" +
                "<img id=\"seasearchcursor\" class=\"cursorimg\" src=\"" + imgDir + "ijn-seasearchcursor.png\" />";
            $("#imagecache").html(html);
        }
        ajaxLoadPhase(function () {
            setTabs();
            selectedZone = game.SelectedLocation;
            ajaxLoadShips(shipsLoaded);
        });
        window.currentPage = "search";
    });
}

// Initialize..........................................................

$(document).ready(function () {
    loadPlayerForPage(function() {
        loadPage();
    });
});
