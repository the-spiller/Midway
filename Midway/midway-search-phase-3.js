/*---------------------------------------------------------------*/
/* Search Map page Air Ops Phase functions                       */
/*---------------------------------------------------------------*/
var forcesLocations = [];

$(document).ready(function () {
    // Load array of our forces' locations to speed attack validation calculations.
    for (var i = 0; i < pageData.Locations.length; i++) {
        if (shipsInZone(pageData.Locations[i], true)) {
            forcesLocations.push(pageData.Locations[i].Zone);
        } else if (pageData.Locations[i].Airbase != null && pageData.Locations[i].Airbase.OwningSide == pageData.PlayerSide) {
            forcesLocations.push(pageData.Locations[i].Zone);
        }
    }

    //bind UI to events
    $("#accordion").on("accordionactivate", function (e, ui) {
        if ($(ui.oldHeader).text() == controlBox.headerAirOps || $(ui.newHeader).text() == controlBox.headerAirOps) {
            switchSelector();
        }
        showAreaHighlight();
    });

    $(".selectlistdiv input").change(function () {
        showAreaHighlight();
    });

    if (pageData.WaitingFlag == "N") {
        // Enable Done button -- nothing in this phase _must_ be done.
        $("#done").removeAttr("disabled");

        $("#addbutton").click(function () {
            showAirOpsDialog(0);
        });

        $("#editbutton").click(function () {
            var idx = this.id.substr(10, 1);
            doSquareSelection(null, pageData.AirOps[idx].Zone);
            showAirOpsDialog(idx);
        });
        
        $("#mission").change(function () {
            var htm = getAvailableAircraftHtml($(this).val());
            $("#ops-available").html(htm);
        });

        $("#ops-cancel").click(function () {
            $("#ops-dialog").bPopup().close();
        });

        $("#ops-ok").click(function () {
     
            $("#ops-dialog").bPopup().close();
            //TODO: capture into attacks list
        });
    } else {
        //Disable Done button
        $("#done").attr("disabled", true);
    }
});

function showAreaHighlight() {
    if (controlBox.headerIs(controlBox.headerOppSearches)) {
        if ($(".selectlistdiv input:checked").length > 0) {
            var areaCoords = gridCalc.topLeftFromZone($(".selectlistdiv input:checked").attr("id") + "A");
            $("#areaHighlight").css({ top: (areaCoords.y - 1) + "px", left: areaCoords.x + "px", visibility: "visible" });
        }
    } else {
        $("#areaHighlight").css("visibility", "hidden");
    }
}

function switchSelector() {
    // Back and forth between the normal zone selector (yellow square) and target selector.
    var topPx = $(window.selectorId).css("top");
    var leftPx = $(window.selectorId).css("left");
    $(window.selectorId).css("visibility", "hidden");

    if (window.selectorId == "#selector") {
        window.selectorId = "#targetselector";
    }
    else {
        window.selectorId = "#selector";
    }
    $(window.selectorId).css({ top: topPx, left: leftPx, visibility: "visible" });
}

function showAirOpsDialog(editIndex) {
    $("#ops-ok").attr("disabled", true);
    
    if (editIndex > 0) {
        // Zone is set in the click event. Load the dialog with the selected mission and aircraft.
        var mission = pageData.AirOps[editIndex].Mission;
        $("#mission option[value*='" + mission + "']").removeAttr("disabled");
        $("#mission").val(mission);
        
    }
    
    // Set zone and mission options into dialog.
    // NOTE: a player can always send in an air attack, even if no known ships are present.
    if (pageData.SelectedLocation == "H5G") {
        $("#zone").text("Midway");

        // Preselect the mission previously chosen if we're editing.
        //TODO: get mission from array of air ops
        
        // Preselect the Midway Reduction mission unless we're editing an existing selection.
        if (pageData.PlayerSide == "IJN") {
            if (editIndex == 0) $("#mission").val("Midway");
        } else {
            $("#mission option[value*='Midway']").attr("disabled", true);
        }

        if (!shipsInZone(getZone(pageData.SelectedLocation, false), true)) {
            // None of our ships there, so no CAP missions.
            $("#mission option[value*='CAP']").attr("disabled", true);
        }
    } else {
        $("#zone").text(pageData.SelectedLocation);

        // Not on Midway, so no Midway Reduction missions.
        $("#mission option[value*='Midway']").attr("disabled", true);

        if (shipsInZone(getZone(pageData.SelectedLocation, false), true)) {
            // Our ships are there, so preselect a CAP mission.
            if (editIndex == 0) $("#mission").val("CAP");
        } else {
            // Preselect the normal attack mission. None of our ships, so no CAP missions.
            if (editIndex == 0) $("#mission").val("Attack");
            $("#mission option[value*='CAP']").attr("disabled", true);
        }
    }

    //Determine aircraft availability and load the list of available aircraft sources accordingly.
    $("#ops-available").html(getAvailableAircraftHtml($("#mission").val()));

    $("#ops-dialog").bPopup({
        transition: 'slideBack',
        transitionClose: 'slideBack',
        modal: true,
        modalClose: false,
        opacity: 0
    });
}

/*-----------------------------------------------*/
/* Determine the availability of aircraft for    */
/* the target zone and mission type. Return the  */
/* HTML to load the list of available aircraft   */
/* sources.                                      */
/*-----------------------------------------------*/
function getAvailableAircraftHtml(missionType) {
    var testSource;
    var possSources = [];
    var i;

    //determine available aircraft locations
    for (i = 0; i < forcesLocations.length; i++) {
        if (aircraftPresent(forcesLocations[i], missionType == "CAP", true)) {
            // See if the aircraft can be recovered within their range.
            testSource = nearestRecoveryZone(forcesLocations[i], pageData.SelectedLocation);
            if (testSource != "") {
                possSources.push(forcesLocations[i]);
            }
        }
    }
    if (possSources.length > 0) {
        // Get carriers and their aircraft to display in the available aircraft div
        for (i = 0; i < possSources.length; i++) {

        }        
    } else {
        $("#ops-available").html("<div style='color: #7f0000; font-weight: 700;'>No aircraft in a Ready state are within range.</div>");
    }
}

/*----------------------------------------------------------*/
/* Returns true if aircraft are found in the input zone. If */
/* forCAP is true, only fighter aircraft are considered. If */
/* readOnly is true, the aircraft must be in a Ready state. */
/*----------------------------------------------------------*/
function aircraftPresent(zone, forCAP, readyOnly) {
    var ret = false;
    var count;
    var zoneObj = getZone(zone, false);

    if (zoneObj.Ships != null) {
        for (var i = 0; i < zoneObj.Ships.length; i++) {
            if (zoneObj.Ships[i].ShipType.indexOf("CV") > -1) {
                if (readyOnly && zoneObj.Ships[i].AirReadyState == 2 || !readyOnly) {
                    if (forCAP) {
                        count = zoneObj.Ships[i].FSquadrons;
                    } else {
                        count = zoneObj.Ships[i].TSquadrons + zoneObj.Ships[i].FSquadrons + zoneObj.Ships[i].DSquadrons;
                    }
                    if (count > 0) {
                        ret = true;
                        break;
                    }
                }
            }
        }
    }
    if (ret == false && zoneObj.Airbase != null) {
        if (readyOnly && zoneObj.Airbase.AirReadyState == 2 || !readyOnly) {
            if (forCAP) {
                count = zoneObj.Airbase.FSquadrons;
            } else {
                count = zoneObj.Airbase.TSquadrons + zoneObj.Airbase.FSquadrons + zoneObj.Airbase.DSquadrons;
            }
            if (count > 0) {
                ret = true;
            }
        }
    }
    return ret;
}
gridCalc.zonesApart

/*---------------------------------------------------------------*/
/* Return the location string for the nearest zone containing an */
/* airbase or carrier that can recover aircraft. If nothing is   */
/* within max range less the distance between source and target, */
/* return an empty string. Note that this procedure does NOT     */
/* ensure that all aircraft on a mission can be recovered.       */
/*---------------------------------------------------------------*/
function nearestRecoveryZone(sourceZone, targetZone) {
    if (sourceZone == targetZone) {
        return sourceZone;
    }

    var ret = "";
    var zonesRemaining = this.attackRange - (gridCalc.zonesApart(sourceZone, targetZone));

    if (zonesRemaining > 0) {
        var zoneObj;
        var foundZones = [];
        var foundZone = { zone: "", dist: 0 };
        var minZones = zonesRemaining + 1;

        for (var i = 0; i < pageData.Locations.length; i++)
        {
            if (shipsInZone(pageData.Locations[i], true)) {
                zoneObj = pageData.Locations[i];
                foundZone.dist = gridCalc.zonesApart(zoneObj.Zone, targetZone);

                if (foundZone.dist <= zonesRemaining) {
                    for (var j = 0; j < pageData.Locations[i].Ships.length; j++) {
                        if (zoneObj.Ships[i].ShipType.indexOf("CV") > -1) {
                            foundZone.zone = zoneObj.Zone;
                            foundZones.push(foundZone);
                            break;
                        }
                    }
                }
            } else if (pageData.Locations[i] != null && pageData.Locations[i].Airbase != null) {
                if (pageData.Locations[i].Airbase.OwningSide == pageData.PlayerSide) {
                    foundZone.dist = gridCalc.zonesApart(pageData.Locations[i].Zone, targetZone);
                    if (foundZone.dist <= zonesRemaining) {
                        foundZone.zone = pageData.Locations[i].Zone;
                        foundZones.push(foundZone);
                    }
                }
            }
        }

        // Find the zone that's closest.
        for (i = 0; i < foundZones.length; i++) {
            if (foundZones[i].dist < minZones) {
                minZones = foundZones[i].dist;
                ret = foundZones[i].zone;
            }
        }
    }
    return ret;
}
