var canvas = document.getElementById("searchcanvas"),
    mapLeft = 5,
    divLeft = 974,
    imgDir = "/content/images/search/",
    bgImg = imgDir + "bg-search.jpg",
    flagImg = "/content/images/usn-med.png",
    mapImg = null,
    captionColor = "usnblue",
    game = {},
    side,
    phase = {},
    ships = [],
    shipZones = [],
    searches = [],
    oppSearches = [],
    lastShipSelected = null,
    selectedZone = "",
    selectedArea,
    mouseDown = false,
    dirty = false,
    dragThang = {
        dragging: false,
        origin: "",
        dragData: null,
        cursorImg: null,
        cursorOffset: { x: 0, y: 0 },
        useSnapshot: false,
        snapshot: null,
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
        ajaxPutPhase(function() {
            reload();
        });
    }
});

$(canvas).on("click", function (e) {
    selectZone(windowToCanvas(canvas, e.clientX, e.clientY));
}).on("dblclick", function (e) {
    var coords = windowToCanvas(canvas, e.clientX, e.clientY),
        zone = searchGrid.coordsToZone(coords);
    if ($.inArray(zone, shipZones) != -1) {
        $("#zone").find("div.shipitem").addClass("selected");
    }
});

// Event handlers for dynamically-loaded elements
$(document).on("click", ".tablistitem", function (e) {
    workTabs(e);
}).on("click", ".shipitem", function (e) {
    doShipSelection(this, (e.shiftKey));
    mouseDown = false;
}).on("mousedown", ".shipitem", function (e) {
    controlItemMouseDown(e);
}).on("mousedown", ".searchitem", function (e) {
    controlItemMouseDown(e);
}).on("mouseenter", ".oppsearchitem", function (e) {
    showOppSearchedArea(e);
}).on("mouseleave", ".oppsearchitem", function () {
    hideOppSearchedArea();
});

if (game.PhaseId == 1) {
    $("#airreadiness").on("click", function() {
        if (game.AircraftReadyState == 0)
            game.AircraftReadyState = 1;
        else if (game.AircraftReadyState == 1)
            game.AircraftReadyState = 0;
        else {
            showAlert("Air Readiness",
                "Your aircraft are ready for operations. Are you sure you want to move them down to the hangar deck?",
                DLG_YESCANCEL, "blue", function(choice) {
                    if (choice == "Yes")
                        game.AircraftReadyState = 0;
                });
        }
        showAirReadiness();
        dirty = true;
    });

    $(document).on("mouseup", function() {
        mouseDown = false;
        if (dragThang.dragging) {
            dragThang.dragging = false;
            if (dragThang.origin == "arrivals")
                searchGrid.removeArrivalZones(side);
            else if (dragThang.useSnapshot)
                searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
        }
    });
    $(canvas).on("mousedown", function(e) {
        canvasMouseDown(e);
    }).on("mouseup", function(e) {
        canvasMouseUp(e);
    });
}

// Functions...........................................................

/*-------------------------------------------------------------------*/
/* Return to the home page w/o saving.                               */
/*-------------------------------------------------------------------*/
function goHome() {
    searchGrid.clearCanvas();
    document.location.href = "/views/home.html";
}

/*-------------------------------------------------------------------*/
/* Start over with the player reset done by ajaxPostPhase.           */
/*-------------------------------------------------------------------*/
function reload() {
    searchGrid.clearCanvas();
    loadPage();
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
/* Walk the ships array and draw a fleet marker at each              */
/* ship.Location found, reloading the shipZones array as we go. If   */
/* the excludedZones array is populated, don't draw a marker at      */
/* the locations it contains.                                        */
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
/*-------------------------------------------------------------------*/

function drawCursorImg(x, y) {
    dragThang.snapshot = searchGrid.drawSearchCursor(dragThang.snapshot, dragThang.cursorImg, x, y);
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
/* Display on the Arrived tab any of the player's ships that have    */
/* arrived this turn.                                                */
/*-------------------------------------------------------------------*/

function showArrivingShips() {
    if (game.PhaseId > 1) return;

    var html = "<ul>";
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "ARR") {
            html += getShipListItemHtml(ships[i]);
        }
    }
    $("#arrivals").html(html + "</ul>").addClass("tabshown");
    $("#arrivalstab").addClass("tabshown");
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function showSearchControls() {
    if (game.PhaseId != 2) return;

    var srchHtml = "<div style=\"margin: 5px 0 15px 5px;\">Available searches</div><ul>",
        searchDesc,
        searchImg = imgDir + side.toLowerCase() + "-air-search.png";

    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && !searches[i].Area) {
            if (searches[i].SearchType == "sea") {
                searchDesc = "Search any area containing one of your ships";
                searchImg = imgDir + "sea-search.png";
            } else if (game.SearchRange == 0) { //Unlimited
                searchDesc = "Search any area";
            } else {
                searchDesc = "Search any area within " + game.SearchRange + " zones of any of your ships";
            }
            srchHtml += "<li><div id=\"search-" + searches[i].SearchNumber + "\" class=\"noselect searchitem\"" +
                " title=\"" + searchDesc + "\">" +
                "<img id=\"searchimg-" + searches[i].SearchNumber + "\" src=\"" + searchImg + "\" draggable=\"false\" />" +
                "</div></li>";
        }
    }
    $("#search").html(srchHtml);
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function showAirOpsControls() {
    if (game.PhaseId != 3) return;

    // Opponent's searches
    var opsHtml = "<div class=\"listheader\">Opponent's searches</div>",
        airPath = side == "USN" ? imgDir + "ijn-air-search.png" : imgDir + "usn-air-search.png",
        seaPath = imgDir + "sea-search.png";
    if (oppSearches.length == 0) {
        opsHtml += "<div style=\"padding: 8px;\">Your opponent did not search.</div>";
    } else {
        opsHtml += "<table style=\"border-collapse: collapse;\">";
        for (var i = 0; i < oppSearches.length; i++) {
            var searchImgSrc = airPath;
            var margin = "";
            if (oppSearches[i].SearchType == "sea") {
                searchImgSrc = seaPath;
                margin = " margin: 0 -300px;";
            }

            var zones = "No ships sighted";
            if (oppSearches[i].Markers.length) {
                zones = "<span style=\"color: #ffd651;\">Ships sighted at ";
                for (var j = 0; j < oppSearches[i].Markers.length; j++) {
                    zones += oppSearches[i].Markers[j].Zone + ", ";
                }
                zones = zones.substr(0, zones.length - 2) + "</span>";
            }
            opsHtml += "<tr id=\"" + oppSearches[i].Area + "\" class=\"oppsearchitem\"><td style=\"width: 33%;"
                + margin + "\">" +
                "<img src=\"" + searchImgSrc + "\" /></td><td style=\"width: 66%;\">Area " + oppSearches[i].Area +
                "<br />" + zones + "</td></tr>";
        }
    }
    $("#airops").html(opsHtml);
}
/*-------------------------------------------------------------------*/
/* Highlight the area of an opponent's search item.                  */
/*-------------------------------------------------------------------*/
function showOppSearchedArea(e) {
    mapImg = searchGrid.grabImageData();
    var area = $(e.target).text().substr(5, 2);
    if (area)
        searchGrid.drawOppSearchArea(area);
}
/*-------------------------------------------------------------------*/
/* Remove the highlight of an opponent's search item's area.         */
/*-------------------------------------------------------------------*/
function hideOppSearchedArea() {
    if (mapImg) {
        searchGrid.restoreImageData(mapImg, 0, 0);
    }
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
    var imgElement = document.getElementById("readinessimg"), readyDesc;
    switch (game.AircraftReadyState) {
    case 0:
        imgElement.src = imgDir + side.toLowerCase() + "-airnotready.png";
        readyDesc = "not ready";
        break;
    case 1:
        imgElement.src = imgDir + side.toLowerCase() + "-airreadying.png";
        readyDesc = "readying";
        break;
    default:
        imgElement.src = imgDir + side.toLowerCase() + "-airready.png";
        readyDesc = "ready";
        break;
    }
    if (game.PhaseId > 1)
        $("#airreadiness").prop("title", "Aircraft " + readyDesc).addClass("disable");
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function getSearch(searchItem) {
    if (!searchItem) return null;
    var searchNum = Number(searchItem.id.substr(searchItem.id.indexOf("-") + 1));
    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && searches[i].SearchNumber == searchNum)
            return searches[i];
    }
    return null;
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function getSelectedShips(tabId) {
    var selShips = [],
        $list = $("#" + tabId).find("div.shipitem.selected"),
        id;

    for (var i = 0; i < $list.length; i++) {
        if ($list[i].id.indexOf("airbase-") == -1) {
            id = $list[i].id.substr($list[i].id.indexOf("-") + 1);
            selShips.push(getShipById(id));
        }
    }
    return selShips;
}

/*-------------------------------------------------------------------*/
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
/* Move fleet marker to a new location on the map.                   */
/*-------------------------------------------------------------------*/

function sailShips(startZone, endZone) {
    var startPos = searchGrid.zoneToTopLeftCoords(startZone),
        endPos = searchGrid.zoneToTopLeftCoords(endZone),
        distX = endPos.x - startPos.x,
        distY = endPos.y - startPos.y,
        startTime = new Date().getTime(),
        elapsed = 0,
        duration = 250 * Math.max(distX, distY), // animate for one second
        handle;

    searchGrid.drawMap(function() {
        drawSightings();
        drawShips([startZone, endZone]);
        mapImg = searchGrid.grabImageData();
        shipsAnim();
    });

    function shipsAnim() {
        handle = window.requestAnimationFrame(shipsAnim);
        elapsed = new Date().getTime() - startTime;

        if (elapsed >= duration) {
            window.cancelAnimationFrame(handle);
            searchGrid.drawMap(function() {
                drawSightings();
                drawShips();
                searchGrid.drawSelector(addVectors(searchGrid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 }), 1);
                showShipsInZone(selectedZone);
            });
        } else {
            var thisX = startPos.x + ((elapsed / duration) * distX);
            var thisY = startPos.y + ((elapsed / duration) * distY);
            searchGrid.restoreImageData(mapImg, 0, 0);
            searchGrid.drawShipsMarker({ x: thisX, y: thisY });
        }
    }
}

/*-------------------------------------------------------------------*/
/* 
/*-------------------------------------------------------------------*/

function controlItemMouseDown(e) {
    var panelId = $("#tabpanels").find("div.tabshown").attr("id");
    if (!panelId) return;

    dragThang.dragging = false;
    dragThang.origin = panelId;

    if (game.PhaseId == 1 && panelId == "arrivals") {
        var selShips = getSelectedShips("arrivals");
        if (selShips.length > 0) {
            mouseDown = true;
            dragThang.dragData = selShips;
            dragThang.useSnapshot = true;
            dragThang.cursorImg = document.getElementById("fleet");
            dragThang.snapshot = null;

            setTimeout(beginControlsDrag, 150);
        }
    } else if (game.PhaseId == 2 & panelId == "search") {
        var selSearch = getSearch(e.target);
        if (selSearch) {
            mouseDown = true;
            dragThang.dragData = selSearch;
            dragThang.cursorImg = document.getElementById(selSearch.SearchType + "searchcursor");
            dragThang.cursorOffset = { x: -40, y: -40 },
            dragThang.useSnapshot = false;
            dragThang.snapshot = null;
            selectedArea = "";

            setTimeout(beginControlsDrag, 150);
        }
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function canvasMouseDown(e) {
    if (game.PhaseId == 1) {
        mouseDown = true;
        var zone = searchGrid.coordsToZone(windowToCanvas(canvas, e.clientX, e.clientY)),
            selShips = getSelectedShips("zone");

        if (selShips.length > 0) {
            dragThang.dragging = false;
            dragThang.origin = zone;
            dragThang.dragData = selShips;
            dragThang.cursorImg = null;
            dragThang.useSnapshot = true;
            dragThang.snapshot = null;

            setTimeout(beginControlsDrag, 150);
        }
        e.preventDefault();
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function beginControlsDrag() {
    if (mouseDown) {
        dragThang.dragging = true;
        if (dragThang.origin == "arrivals") searchGrid.highlightArrivalZones(side);
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
/*-------------------------------------------------------------------*/

function canvasMouseUp(e) {
    mouseDown = false;
    if (dragThang.dragging) {
        dragThang.dragging = false;
        canvas.removeEventListener("mousemove", canvasMouseMove, false);
        if (dragThang.origin == "arrivals") searchGrid.removeArrivalZones(side);

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
                searchGrid.drawShipsMarker(searchGrid.coordsToTopLeftCoords(coords));
                $("#arrivals").find("div.shipitem").remove(".selected").parent();
                selectZone(coords);
                if ($("#arrivals").find("div.shipitem").length == 0) {
                    $("#zonetab").trigger("click");
                }
            } else {
                //movement's done
                sailShips(dragThang.origin, zone);
            }
            dirty = true;
        }
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function isLegitDrop(coords) {
    var dropZone = searchGrid.coordsToZone(coords);
    if (dropZone == dragThang.origin) return true;

    if (dragThang.origin == "arrivals") {
        if (side == "USN") {
            if (dropZone.substr(0, 1) == "I" && "BEH".indexOf(dropZone.substr(2, 1)) != -1)
                return true;
        } else {
            if (dropZone.substr(0, 1) == "A" && "ADG".indexOf(dropZone.substr(2, 1)) != -1)
                return true;
        }
    } else if (isNumber(dragThang.origin.substr(1, 1))) {
        var zones = searchGrid.zoneDistance(dragThang.origin, dropZone),
            moves = getShipsMinMovePoints(dragThang.origin);
        if (zones <= moves) return true;
    }
    return false;
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function withinSearchRange(coords) {
    var zone = searchGrid.coordsToZone(coords),
        i;

    if (!zone) return false;
    var area = zone.substr(0, 2);
    if (dragThang.dragData.SearchType == "air") {
        if (game.SearchRange == 0) return true; //zero = infinite range (entire map)

        for (i = 0; i < shipZones.length; i++) {
            if (searchGrid.zoneDistance(area + "E", shipZones[i]) <= (game.SearchRange + 1))
                return true;
        }
    } else {
        for (i = 0; i < shipZones.length; i++) {
            if (shipZones[i].substr(0, 2) == area)
                return true;
        }
    }
    return false;
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function showSearching(canvasCoords) {
    if (withinSearchRange(canvasCoords)) {
        canvas.style.cursor = "none";
        var coords = addVectors(canvasCoords, dragThang.cursorOffset);
        drawCursorImg(coords.x, coords.y);
        selectArea(canvasCoords);
    } else {
        if (dragThang.snapshot) searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
        canvas.style.cursor = "auto";
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function hideSearching() {
    canvas.style.cursor = "auto";
    if (dragThang.snapshot) {
        searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function executeSearch(coords, zone, search, callback) {
    if (withinSearchRange(coords)) {
        var area = zone.substr(0, 2);
        if (!alreadySearched(area)) {
            search.Area = area;
            ajaxPostSearch(search, function() {
                $("#search-" + search.SearchNumber).remove().parent();
                if (search.Markers && search.Markers.length) {
                    var msg = "Enemy ships sighted!";
                    for (var i = 0; i < search.Markers.length; i++) {
                        msg += "<p>In zone " + search.Markers[i].Zone + ": " + search.Markers[i].TypesFound + "</p>";
                    }
                    showAlert("Search", msg, DLG_OK, "blue", callback);

                } else {
                    showAlert("Search", "No sightings.", DLG_OK, "blue", callback);
                }
            });
        } else {
            showAlert("Search", "You've already searched area " + area + "!", DLG_OK, "blue", callback);
        }
    } else {
        if (dragThang.snapshot) searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
        canvas.style.cursor = "auto";
        if (callback) callback();
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function alreadySearched(area) {
    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && searches[i].Area == area)
            return true;
    }
    return false;
}

/*-------------------------------------------------------------------*/
/* Mark ships data with a new location.                              */
/*-------------------------------------------------------------------*/

function relocateShips(zone, movedShips, cost) {
    for (var i = 0; i < movedShips.length; i++) {
        movedShips[i].MovePoints -= cost;
        movedShips[i].Location = zone;
    }
}

/*-------------------------------------------------------------------*/
/* Return true if all of this turn's arrivals have been brought on   */
/* to the map.                                                       */
/*-------------------------------------------------------------------*/

function allArrivalsOnMap() {
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "ARR")
            return false;
    }
    return true;
}

/*-------------------------------------------------------------------*/
/* Find and return the minimum available movement points among ships */
/* in the input zone.
/*-------------------------------------------------------------------*/

function getShipsMinMovePoints(zone) {
    var min = 999;
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == zone && ships[i].ShipType != "BAS") {
            if (ships[i].MovePoints < min) min = ships[i].MovePoints;
        }
    }
    return min == 999 ? 0 : min;
}

/*-------------------------------------------------------------------*/
/* Copy one search object to another.                                */
/*-------------------------------------------------------------------*/

function copySearch(fromSearch) {
    var toSearch = {
        GameId: fromSearch.GameId,
        PlayerId: fromSearch.PlayerId,
        Turn: fromSearch.Turn,
        SearchNumber: fromSearch.SearchNumber,
        SearchType: fromSearch.SearchType,
        Area: fromSearch.Area,
        Markers: []
    };
    if (fromSearch.Markers.length) {
        for (var i = 0; i < fromSearch.Markers.length; i++) {
            toSearch.Markers.push({ Zone: fromSearch.Markers[i].Zone, TypesFound: fromSearch.Markers[i].TypesFound });
        }
    }
    return toSearch;
}

/*-------------------------------------------------------------------*/
/* Remove opponent's searches from searches[] and move them to their */
/* own oppSearches[].                                                */
/*-------------------------------------------------------------------*/

function splitOffOpponentSearches() {
    if (game.PhaseId != 3) return;

    oppSearches = [];
    var i = searches.length;
    while (i--) {
        if (searches[i].PlayerId != window.player.PlayerId) {
            oppSearches.push(copySearch(searches[i]));
            searches.splice(i, 1);
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
            splitOffOpponentSearches();
            if (successCallback) successCallback();
        },
        error: function(xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

/*-------------------------------------------------------------------*/
/* Make ajax call to post new search to the server and find out if   */
/* it was successful.                                                */
/*-------------------------------------------------------------------*/

function ajaxPostSearch(search, successCallback) {
    $.ajax({
        url: "/api/search",
        type: "POST",
        data: search,
        success: function(data) {
            var retSearch = JSON.parse(data);
            createUpdateAuthCookie();
            if (retSearch.Markers) {
                for (var i = 0; i < retSearch.Markers.length; i++) {
                    search.Markers.push({
                        Zone: retSearch.Markers[i].Zone,
                        TypesFound: retSearch.Markers[i].TypesFound
                    });
                }
            }
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
        data: {
            GameId: game.GameId,
            PlayerId: window.player.PlayerId,
            SelectedZone: selectedZone,
            AirReadiness: game.AircraftReadyState,
            Points: game.Points,
            Ships: shipsToPass,
            Searches: searches
        },
        success: function(data) {
            window.player = JSON.parse(data);
            createUpdateAuthCookie();
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
    var tabHtml = "", panelHtml = "", showFirst = " tabshown";
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
        searchGrid.drawMap(function() {
            drawShips();
            drawSightings();

            if (selectedZone) {
                var coords = addVectors(searchGrid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 });
                searchGrid.drawSelector(coords, 1);
            }
            showShipsInZone(selectedZone);

            // each of these knows to bail if it's not their phase
            showArrivingShips();
            showSearchControls();
            showAirOpsControls();

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
    ajaxLoadPhase(function() {
        setTabs();
        selectedZone = game.SelectedLocation;
        selectedArea = "";
        ajaxLoadShips(shipsLoaded);
    });
    window.currentPage = "search";
}

// Initialize..........................................................

$(document).ready(function () {
    loadPlayerForPage(function() {
        loadPage();
    });
});
