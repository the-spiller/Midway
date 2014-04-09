
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

$(canvas).on("mousedown", function (e) {
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

    dragThang.dragging = false;
    dragThang.origin = panelId;

    var selShips = getSelectedShips(panelId);
    if (selShips.length > 0) {
        mouseDown = true;
        dragThang.dragData = selShips;
        dragThang.useSnapshot = true;
        dragThang.cursorImg = document.getElementById("fleet");
        dragThang.snapshot = null;

        setTimeout(beginControlsDrag, 150);
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
/* "Sail" fleet marker to a new location on the map.                 */
/*-------------------------------------------------------------------*/
function sailShips(startZone, endZone) {
    var startPos = searchGrid.zoneToTopLeftCoords(startZone),
        endPos = searchGrid.zoneToTopLeftCoords(endZone),
        distX = endPos.x - startPos.x,
        distY = endPos.y - startPos.y,
        startTime = new Date().getTime(),
        elapsed = 0,
        duration = 10 * Math.max(Math.abs(distX), Math.abs(distY)), // set animation duration based on distance to be covered
        handle;

    searchGrid.drawMap(function () {
        searchGrid.highlightArrivalZones(side);
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
                searchGrid.highlightArrivalZones(side);
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
