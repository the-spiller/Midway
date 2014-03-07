/*-------------------------------------------*/
// moveUndo object
var moveUndo = { StartZone: null, EndZone: null, ShipIds: [] };

$(document).ready(function () {
    // Done button -- the only thing that MUST be done is bring in reinforcements.
    if (pageData.WaitingFlag == "N" && (pageData.ArrivingShips == null || pageData.ArrivingShips.length == 0)) {
        $("#done").removeAttr("disabled");
    } else {
        $("#done").attr("disabled", true);
    }
    
    // Aircraft readiness buttons
    $(".readyimg").click(function () {
        var entity;
        var divId = $(this).parent().attr("id");
        
        if (divId.indexOf("readydiv-airbase") == -1) {
            // It's a ship
            entity = getShip(divId.substring(8));
        } else {
            // It's an airbase
            entity = getAirbase(divId.substring(16));
        }

        if (entity.AirReadyState == 0) {
            entity.AirReadyState = 1;
            $(this).css("visibility", "hidden");
            $("#" + divId +" .readying").css("visibility", "visible");
        } else {
            entity.AirReadyState = 0;
            $(this).css("visibility", "hidden");
            $("#" + divId + " .notready").css("visibility", "visible");
        }
    });
});

function doMovement(zone) {
    // Put any selected ships into newly selected zone, if it's a legitimate move.
    var showMove = true;
    if (controlBox.headerIs(controlBox.headerArrivals) && $("#reinforce .ui-selected").length > 0) {
        // Place arrivals on map.
        if (moveSelectedShipsData(zone)) {
            placeShipsMarker(zone);

            $("#reinforce .ui-selected").remove();
            if ($("#reinforce li").length == 0) {
                $("#reinforce-content").text("No more arrivals.");
                $("#done").removeAttr("disabled");
            }

            $("#undo").removeAttr("disabled");
        } else {
            showMove = false;
        }
    } else if (pageData.WaitingFlag == "N" && controlBox.headerIs(controlBox.headerSelected) && $("#see .ui-selected").length > 0) {
        // Move ships in selected zone to new location.
        if (pageData.SelectedLocation != zone) {
            if (moveSelectedShipsData(zone)) {
                moveShipsTo(zone);

                // Clear selected items from the control list and enable the Undo button.
                $("#see .ui-selected").remove();
                $("#undo").removeAttr("disabled");
            } else {
                showMove = false;
            }
        }
    }
    return showMove;
}

/*---------------------------------------------------------------------*/
/* Change the location of the control box's selected ships to the      */
/* input new location. This moves the data only, not the display       */
/* markers. Validates the move, and if it's legitimate, rewrites the   */
/* data and returns true.                                              */
/*---------------------------------------------------------------------*/
function moveSelectedShipsData(newZone) {
    var controlList;
    var okToMove = true;
    var oldZoneShipList;
    var edge;
    var i;

    if (controlBox.headerIs(controlBox.headerArrivals)) {
        controlList = "#reinforce";
        if (gridCalc.edgeZoneSelected(newZone)) {
            moveUndo.StartZone = null;
            oldZoneShipList = pageData.ArrivingShips;
        } else {
            if (pageData.PlayerSide == "USN") {
                edge = "EASTERN (RIGHT)";
            } else {
                edge = "WESTERN (LEFT)";
            }
            showInfoDialog("ARRIVING SHIPS MUST BE PLACED ON THE " + edge + " MAP EDGE");
            okToMove = false;
        }
    } else {   // it's got to be controlBox.headerSelected
        controlList = "#see";
        oldZoneShipList = getZone(pageData.SelectedLocation, false).Ships;

        // Check to see that all selected ships have the required movement points.
        var movePts = gridCalc.zonesApart(pageData.SelectedLocation, newZone);
        $(controlList + " .ui-selected").each(function () {
            i = 0;
            while (oldZoneShipList[i].Id != this.id) {
                i++;
            }
            if (oldZoneShipList[i].MovePoints < movePts) {
                showInfoDialog("SORRY, CAN'T GO THAT FAR".toUpperCase());
                okToMove = false;
                return false;   //breaks out of JQuery.each loop
            }
            return true;
        });
        
        if (okToMove) {
            // Set undo original location parameter
            moveUndo.StartZone = pageData.SelectedLocation;

            // Take away the movement points used.
            $("#see .ui-selected").each(function () {
                i = 0;
                while (oldZoneShipList[i].Id != this.id) {
                    i++;
                }
                oldZoneShipList[i].MovePoints -= movePts;
            });
        }
    }
    if (okToMove) {
        // Move ships data to new location (saving undo data as we do it).
        moveUndo.EndZone = newZone;
        moveUndo.ShipIds = [];
        var newZoneShipList = getZone(newZone, true).Ships;

        var newIdx = newZoneShipList.length;
        var undoIdx = 0;
        $(controlList + " .ui-selected").each(function () {
            i = 0;
            while (oldZoneShipList[i].Id != this.id) {
                i++;
            }
            newZoneShipList[newIdx] = oldZoneShipList[i];
            moveUndo.ShipIds[undoIdx] = oldZoneShipList[i].Id;
            oldZoneShipList.splice(i, 1);

            // Reset tooltip for the ships in the "Ready aircraft" panel.
            var ship = newZoneShipList[newIdx];
            if ($("#readydiv" + ship.Id).length > 0) {
                $("#readydiv" + ship.Id).attr("title",
                    (ship.ShipType == "CVL" ? "Light c" : "C") + "arrier " + ship.Name + " at " + newZone);
            }
            newIdx++;
            undoIdx++;
        });
        newZoneShipList.sort(sortByIdAsc);
    }
    return okToMove;
}

/*--------------------------------------------------------*/
/* Move ships display marker to the new location.         */
/* Counts on the ship data having already been updated    */
/* to reflect the move (via call to moveSelectedShipsData */
/* function above) and that the pageData.SelectedSquare   */
/* attribute has not been changed yet.                    */
/*--------------------------------------------------------*/
function moveShipsTo(newZone) {
    var shipsMarker = document.getElementById("s" + pageData.SelectedLocation);
    var point;

    // Data's already moved, so see if there are ships left in the original location.
    if (shipsInZone(getZone(pageData.SelectedLocation, false), true)) {
        // We're leaving ships behind, so create a new marker instead of using the one that's there.
        point = gridCalc.topLeftFromZone(pageData.SelectedLocation);
        shipsMarker = $("#" + getShipsMarkerImgId("ships")).clone(false)
            .addClass("shipsmarker")
            .css({ top: point.y + "px", left: (point.x - gridCalc.squareSize) + "px" })
            .appendTo("#stage");
    }

    // Move the marker to the new location
    point = gridCalc.topLeftFromZone(newZone);
    $(shipsMarker).animate(
        {
            top: point.y + "px",
            left: (point.x - gridCalc.squareSize) + "px"
        },
        gridCalc.zonesApart(pageData.SelectedLocation, newZone) * 200,
        "easeInOutCubic",
        function () {
            completeMove(newZone, shipsMarker);
        });
}
/*------------------------------------------------*/
/* If a ships marker already exists at the target */
/* location, remove it. Park the moved marker.    */
/*------------------------------------------------*/
function completeMove(newZone, shipsMarker) {
    if ($("#s" + newZone).length) {
        $("#s" + newZone).remove();
    }
    $(shipsMarker).attr("id", "s" + newZone);
}

/*--------------------------------------------------------*/
/* Parse the moveUndo object and restore ships, etc.      */
/* to the state they were in before the last user action. */
/*--------------------------------------------------------*/
function doMoveUndo()
{
    var undoLocObj = getZone(moveUndo.EndZone, false);
    var undoShips = undoLocObj.Ships;
    var i;
    var idx;
    if (moveUndo.StartZone == null) {    // Undo placement of arriving ship(s).
        // Find ships matching those in the undo list in the new location's ship list
        // and put them back into pageData.ArrivingShips.
        idx = pageData.ArrivingShips.length;
        $(moveUndo.ShipIds).each(function () {
            i = 0;
            while (undoShips[i].Id != this) {
                i++;
            }
            pageData.ArrivingShips[idx] = undoShips[i];
            pageData.ArrivingShips[idx].Zone = null;
            idx++;
            undoShips.splice(i, 1);
        });
        // Sort arrivals array.
        pageData.ArrivingShips.sort(sortByIdAsc);

        // Clear and redisplay control box arrivals lists.
        $("#reinforce-content").text("");
        showControlListShips(null);

        // Disable Done button (all ships MUST be brought in).
        $("#done").attr("disabled", true);
    } else {    // Undo movement of ships.
        // Restore original location and movement points,
        // and remove ships from second location's array.
        var origLocShips = getZone(moveUndo.StartZone, false).Ships;
        idx = origLocShips.length;
        var movePoints = gridCalc.zonesApart(moveUndo.StartZone, moveUndo.EndZone);
        $(moveUndo.ShipIds).each(function () {
            i = 0;
            while (undoShips[i].Id != this) {
                i++;
            }
            origLocShips[idx] = undoShips[i];
            origLocShips[idx].Zone = moveUndo.StartZone;
            origLocShips[idx].MovePoints += movePoints;
            idx++;
            undoShips.splice(i, 1);
        });

        // Sort list and put ships marker back on original location.
        origLocShips.sort(sortByIdAsc);
        placeShipsMarker(moveUndo.StartZone);
    }

    // Remove ships marker from map if all ships are gone and
    // reset the Selected Ships display.
    if (!shipsInZone(undoLocObj, true)) {
        $("#s" + moveUndo.EndZone).remove();
    }
    showControlListShips(moveUndo.EndZone);
}
