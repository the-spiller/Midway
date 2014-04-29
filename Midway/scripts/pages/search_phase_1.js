
// Events and functions for Phase 1 (Search Map Move)

$("#airreadiness").on("click", function () {
    if (game.AircraftReadyState == 0) {
        game.AircraftReadyState = 1;
        dirty = true;
    } else if (game.AircraftReadyState == 1) {
        game.AircraftReadyState = 0;
        dirty = true;
    } else {
        showAlert("Air Readiness",
            "Your aircraft are ready for operations. Are you sure you want to move them down to the hangar deck?",
            DLG_YESCANCEL, "blue", function(choice) {
                if (choice == "Yes") {
                    game.AircraftReadyState = 0;
                    dirty = true;
                }
            });
    }
    showAirReadiness();
});

$(document).on("mousedown", ".shipitem", function() {
    shipItemMouseDown();
});

$("#canvii").on("mousedown", function (e) {
    mouseDown = true;
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
/* Display on the Arrived tab any of the player's ships that have    */
/* arrived this turn.                                                */
/*-------------------------------------------------------------------*/
function loadPhaseTab() {
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
/* Initialize an arrivals drag operation.                            */
/*-------------------------------------------------------------------*/
function shipItemMouseDown() {
    var panelId = $("#tabpanels").find("div.tabshown").attr("id") || "null";
    if (panelId != "arrivals") return;

    dragMgr.dragging = false;
    dragMgr.source = panelId;

    var selShips = getSelectedShips(panelId);
    if (selShips.length > 0) {
        mouseDown = true;
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
    if (sfxSailing) sfxSailing.play();
    
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
        mapImg = searchGrid.grabImageData();
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
                if (sfxSailing) sfxSailing.fadeOut(SFX_FADEOUT_DURATION, function () { sfxSailing.stop(); });
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
