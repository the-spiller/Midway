
// Events and functions for Phase 1 (Search Map Move)

$(document).on("mousedown", ".shipitem", function() {
    shipItemMouseDown();
}).on("click", ".airreadiness", function (e) {
    if (game.PhaseId != 1) return;
    e.stopPropagation();
    setAircraftState(this);
});

$("#canvii").on("mousedown", function (e) {
    window.mouseDown = true;
    var zone = searchGrid.coordsToZone(windowToCanvas(cvs, e.clientX, e.clientY)),
        selShips = getSelectedShips("zone");

    if (selShips.length > 0) {
        dragMgr.dragging = false;
        dragMgr.source = zone;
        dragMgr.dragData = selShips;
        dragMgr.cursorImg = null;
        dragMgr.useSnapshot = true;
        dragMgr.snapshot = null;

        setTimeout(beginControlsDrag, 150);
    }
    e.preventDefault();
});

/*-------------------------------------------------------------------*/
/* Display on the Arrived tab the player's ships that have           */
/* arrived this turn and are not yet on the map.                     */
/*-------------------------------------------------------------------*/
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

/*-------------------------------------------------------------------*/
/* Initialize an arrivals drag operation.                            */
/*-------------------------------------------------------------------*/
function shipItemMouseDown() {
    var panelId = $("#tabpanels").find("div.tabshown").attr("id") || "";
    if (panelId != "arrivals") return;

    dragMgr.dragging = false;
    dragMgr.source = panelId;

    var selShips = getSelectedShips(panelId);
    if (selShips.length > 0) {
        window.mouseDown = true;
        dragMgr.dragData = selShips;
        dragMgr.useSnapshot = true;
        dragMgr.cursorImg = document.getElementById("fleet");
        dragMgr.snapshot = null;

        setTimeout(beginControlsDrag, 150);
    }
}

/*-------------------------------------------------------------------*/
/* Reads dragging context to determine if drop location is           */
/* legitimate. If so, return true, otherwise false.                  */
/*-------------------------------------------------------------------*/
function isLegitDrop(coords) {
    var dropZone = searchGrid.coordsToZone(coords);
    if (dropZone == dragMgr.source) return true;

    if (dragMgr.source == "arrivals") {
        if (side == "USN") {
            if (dropZone.substr(0, 1) == "I" && "BEH".indexOf(dropZone.substr(2, 1)) != -1)
                return true;
        } else {
            if (dropZone.substr(0, 1) == "A" && "ADG".indexOf(dropZone.substr(2, 1)) != -1)
                return true;
        }
    } else if (isNumber(dragMgr.source.substr(1, 1))) {
        var zones = searchGrid.zoneDistance(dragMgr.source, dropZone),
            moves = getShipsMinMovePoints(dragMgr.source);
        if (zones <= moves) return true;
    }
    return false;
}

/*-------------------------------------------------------------------*/
/* "Sail" fleet marker to a new location on the map.                 */
/*-------------------------------------------------------------------*/
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
            searchGrid.restoreImageData(mapImg, 0, 0);
            searchGrid.drawShipsMarker({ x: thisX, y: thisY });
        }
    }
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
/* Mark ships data with a new location and reload the shipZones[]    */
/* array to reflect the change.                                      */
/*-------------------------------------------------------------------*/
function relocateShips(zone, movedShips, cost) {
    for (var i = 0; i < movedShips.length; i++) {
        movedShips[i].MovePoints -= cost;
        movedShips[i].Location = zone;
    }
    loadShipZones();
}
/*-------------------------------------------------------------------*/
/* Respond to click on air readiness button on ship or airbase list  */
/* item.                                                             */
/*-------------------------------------------------------------------*/
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
