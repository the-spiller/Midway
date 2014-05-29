// Events and functions for Phase 1 (Search Map Move)
var overHighlight = false,
    zonesHighlighted = [];

$(document).on("click", ".airreadiness", function (e) {
    if (game.PhaseId != 1) return;
    e.stopPropagation();
    setAircraftState(this);
});

$("#canvii").on("mousemove", function (e) {
    // show/hide the fleet marker cursor
    if (game.PhaseId != 1 || zonesHighlighted.length == 0) return;
    
    var zone = searchGrid.coordsToZone(windowToCanvas(window.cvs, e.clientX, e.clientY));
    if ($.inArray(zone, zonesHighlighted) > -1) {
        if (!overHighlight) {
            $("#fleetcursor").css("display", "block");
            overHighlight = true;
        }
        var topLeft = searchGrid.zoneToTopLeftCoords(zone),
            left = topLeft.x + (window.mapLeft - searchGrid.zoneSize),
            top = topLeft.y + 60;
        
        $("#fleetcursor").css({ left: left + "px", top: top + "px" });
    } else if (overHighlight) {
        $("#fleetcursor").css("display", "none");
        overHighlight = false;
    }
});

/*---------------------------------------------------------------------------*/
/* Display on the Arrived tab the player's ships that have arrived this turn */
/* and are not yet on the map.                                               */
/*---------------------------------------------------------------------------*/
function loadMovePhase() {
    var arrivals = [],
        html = "<div style=\"margin: 5px;\">No ships arrived this turn.</div>";
    
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "ARR")
            arrivals.push(ships[i]);
    }
    if (arrivals.length > 0) {
        html = "<ul>";
        for (i = 0; i < arrivals.length; i++) {
            html += getShipListItemHtml(ships[i]);
        }
        html += "</ul>";
    }
    $("#arrivals").html(html).addClass("tabshown");
    $("#arrivalstab").addClass("tabshown");
    makeSuggestion();
}

/*---------------------------------------------------------------------------*/
/* In reponse to ship selection, highlight zones where arrivals may be       */
/* placed or on-map ships may move.                                          */
/*---------------------------------------------------------------------------*/
function showMoveHighlight() {
    var panelId = $("#tabpanels").find("div.tabshown").attr("id") || "";
    var selShips = getSelectedShips(panelId);
    if (selShips.length > 0) {
        if (zonesHighlighted.length == 0) {
            if (panelId == "arrivals") {
                // show where arrivals may be placed
                if (side == "USN") {
                    zonesHighlighted = searchGrid.highlightZones("I1B", 1, 20);
                } else {
                    zonesHighlighted = searchGrid.highlightZones("A1A", 1, 20);
                }
            } else if (panelId == "zone") {
                // show square area in which ships may move
                var range = getShipsMinMovePoints(selectedZone);
                if (range == 0) return;

                var hlWidth = (range * 2) + 1,
                    hlHeight = (range * 2) + 1,
                    edgeZoneX = searchGrid.getRelativeZone(selectedZone, { x: -range, y: 0 }),
                    edgeZoneY = searchGrid.getRelativeZone(selectedZone, { x: 0, y: -range }),
                    edgeRangeX = searchGrid.zoneDistance(selectedZone, edgeZoneX),
                    edgeRangeY = searchGrid.zoneDistance(selectedZone, edgeZoneY),
                    topLeftZone = searchGrid.getRelativeZone(selectedZone, { x: -range, y: -range });

                if (edgeRangeX < range) hlWidth = edgeRangeX + range + 1;
                if (edgeRangeY < range) hlHeight = edgeRangeY + range + 1;
                
                zonesHighlighted = searchGrid.highlightZones(topLeftZone, hlWidth, hlHeight);
            }
        }
    } else if (zonesHighlighted.length > 0) {
        searchGrid.removeHighlight();
        $("#fleetcursor").css("display", "none");
        zonesHighlighted = [];
    }
}

/*---------------------------------------------------------------------------*/
/* Called from canvii div click event in search.js. Check to see if the      */
/* clicked zone is within a move highlight area. If so, excute move and      */
/* return true. If not, return false.                                        */
/*---------------------------------------------------------------------------*/
function checkMoveShips(clickEvent) {
    if (zonesHighlighted.length == 0) return false;
    
    var coords = windowToCanvas(window.cvs, clickEvent.clientX, clickEvent.clientY),
        zone = searchGrid.coordsToZone(coords);
    
    if ($.inArray(zone, zonesHighlighted) > -1) {
        moveShips(coords);
        return true;
    }
    return false;
}

/*---------------------------------------------------------------------------*/
/* Respond to click event within move highlight and move selected ships to   */
/* the clicked-on zone.                                                      */
/*---------------------------------------------------------------------------*/
function moveShips(coords) {
    var tabId = $("#tabpanels").find("div.tabshown").attr("id") || "",
    selShips = getSelectedShips(tabId),
    zone = searchGrid.coordsToZone(coords),
    cost = 0;

    searchGrid.removeHighlight();
    zonesHighlighted = [];
    $("#fleetcursor").css("display", "none");
    
    if (tabId == "arrivals") {
        if (sfxArrived && audioVol > 0) sfxArrived.play();
        $("#" + tabId).find("div.shipitem.selected").remove();
        searchGrid.drawShipsMarker(searchGrid.zoneToTopLeftCoords(zone));
    } else {
        cost = searchGrid.zoneDistance(selectedZone, zone);
        sailShips(selectedZone, zone);
    }
    relocateShipsInData(zone, selShips, cost);
    selectZone(coords);
    selectZoneTab();
    window.editsMade = true;
}
/*---------------------------------------------------------------------------*/
/* "Sail" fleet marker to a new location on the map.                         */
/*---------------------------------------------------------------------------*/
function sailShips(startZone, endZone) {
    if (startZone == endZone) return;
    
    if (sfxSailing && audioVol > 0)
        sfxSailing.play().fade(0, audioVol * 0.01, 500);
    
    var startPos = searchGrid.zoneToTopLeftCoords(startZone),
        endPos = searchGrid.zoneToTopLeftCoords(endZone),
        distX = endPos.x - startPos.x,
        distY = endPos.y - startPos.y,
        startTime = new Date().getTime(),
        elapsed = 0,
        duration = 15 * Math.max(Math.abs(distX), Math.abs(distY)), // set animation duration based on distance to be covered
        handle;

    searchGrid.drawMap(function () {
        drawSightings();
        drawShips([startZone, endZone]);
        window.mapImg = searchGrid.grabImageData();
        shipsAnim();
    });

    function shipsAnim() {
        handle = window.requestAnimationFrame(shipsAnim);
        elapsed = new Date().getTime() - startTime;

        if (elapsed >= duration) {
            window.cancelAnimationFrame(handle);
            searchGrid.drawMap(function () {
                drawSightings();
                drawShips();
                searchGrid.drawSelector(addVectors(searchGrid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 }), 1);
                showShipsInZone(selectedZone);
                if (sfxSailing) {
                    sfxSailing.fade(sfxSailing.volume(), 0, 500, function() {
                        sfxSailing.stop();
                    });
                }
            });
        } else {
            var thisX = startPos.x + ((elapsed / duration) * distX);
            var thisY = startPos.y + ((elapsed / duration) * distY);
            searchGrid.restoreImageData(1, mapImg, 0, 0);
            searchGrid.drawShipsMarker({ x: thisX, y: thisY });
        }
    }
}

/*---------------------------------------------------------------------------*/
/* Find and return the minimum available movement points among ships in the  */
/* input zone.                                                               */
/*---------------------------------------------------------------------------*/
function getShipsMinMovePoints(zone) {
    if (game.PhaseId != 1) return 0;
    var min = 999;
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == zone && ships[i].ShipType != "BAS") {
            if (ships[i].MovePoints < min) min = ships[i].MovePoints;
        }
    }
    return min == 999 ? 0 : min;
}

/*---------------------------------------------------------------------------*/
/* Mark ships data with a new location and reload the shipZones[] array to   */
/* reflect the change.                                                       */
/*---------------------------------------------------------------------------*/
function relocateShipsInData(zone, movedShips, cost) {
    for (var i = 0; i < movedShips.length; i++) {
        movedShips[i].MovePoints -= cost;
        movedShips[i].Location = zone;
    }
    loadShipZones();
}
/*---------------------------------------------------------------------------*/
/* Respond to click on air readiness button on a ship or airbase list item.  */
/*---------------------------------------------------------------------------*/
function setAircraftState(airReadinessDiv) {
    var idVals = airReadinessDiv.id.split("-"),
        targetEntity,
        newTitle = "Not ready";

    if (idVals[1] == "airbase") {
        for (var i = 0; i < ships.length; i++) {
            if (ships[i].AirbaseId == idVals[2]) {
                targetEntity = ships[i];
                break;
            }
        }
    } else {
        targetEntity = getShipById(idVals[2]);
    }

    if (targetEntity) {
        switch (targetEntity.AircraftState) {
            case 1:
                targetEntity.AircraftState = 0;
                window.editsMade = true;
                break;
            case 2:
                showAlert("Aircraft Are Ready", "Are you sure you want your aircraft to stand down?", DLG_YESCANCEL, "blue",
                    function (button) {
                        
                    if (button == "Yes") {
                        targetEntity.AircraftState = 0;
                        window.editsMade = true;
                    }
                });
                break;
            default:
                targetEntity.AircraftState = 1;
                newTitle = "Readying";
                window.editsMade = true;
                break;
        }
        //load new image and title string for tooltip
        $(airReadinessDiv).attr("title", newTitle).html("<img src=\"/content/images/search/ready-" + targetEntity.AircraftState +
            ".png\" />");
    }
}
/*---------------------------------------------------------------------------*/
/* Return true if all of this turn's arrivals have been brought onto the map.*/
/*---------------------------------------------------------------------------*/
function allArrivalsOnMap() {
    for (var i = 0; i < ships.length; i++) {
        if (ships[i].Location == "ARR")
            return false;
    }
    return true;
}

