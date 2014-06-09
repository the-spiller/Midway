// Events and functions for Phase 3 (Air Ops)
var oppSearches = [],
    mouseOverSearchItem = false,
    AIROP_RANGE = 14,
    landingZones = [],
    editingOpIdx = -1,
    aircraftSources = [],
    planeTypes = ["T", "F", "D"],
    newOp = {};

// events for dynamically-created elements
$(document).on("mouseover", ".oppsearchitem", function(e) {
    mouseOverSearchItem = true;
    showOppSearchedArea(e.target);
}).on("mouseout", ".oppsearchitem", function() {
    mouseOverSearchItem = false;
    hideOppSearchedArea();
}).on("mouseover", ".oppsearchimg", function(e) {
    showOppSearchedArea(e.target.parentNode.parentNode);
}).on("mouseout", ".oppsearchimg", function() {
    hideOppSearchedArea();
}).on("click", ".airopbutton", function(e) {
    if (e.target.id == "airopadd") {
        editingOpIdx = -1;
        addEditAirOperation();
    } else {
        var idParts = e.target.id.split("-");
        editingOpIdx = Number(idParts[1]);
        if (idParts[0] == "airopedit") {
            addEditAirOperation();
        } else if (idParts[0] == "airopdelete") {
            deleteAirOperation();
        }
    }
}).on("click", ".updowna", function(e) {
    addSquadronToOp(e);
}).on("click", ".updownas", function(e) {
    addShiploadToOp(e);
});

// events for static (in the original html) elements
$("#airopmission").on("change", function () {
    if (editingOpIdx == -1) {
        getNewOp();
        showAirOpSources();
    } 
});
$("#airopOK").on("click", function (e) {
    closeOpDialog(e);
    if (e.target.innerHTML == "OK") {
        saveAirOperation();
    }
});
$("#airopCancel").on("click", function(e) {
    closeOpDialog(e);
});
$("#airopclose").on("click", function (e) {
    closeOpDialog(e);
});

/*-------------------------------------------------------------------*/
/* Load the Air Ops tab with its control elements.                   */
/*-------------------------------------------------------------------*/
function loadAirOpsPhase() {
    loadAircraftSources();
    
    var tabHtml = "<div style=\"margin: 5px 0 15px 5px;\">";
    // Opponent's searches
    if (game.Waiting == "Y") {
        tabHtml += "Waiting for opponent</div>";
    } else {
        var airPath = side == "USN" ? imgDir + "ijn-air-search.png" : imgDir + "usn-air-search.png",
            seaPath = side == "USN" ? imgDir + "ijn-sea-search.png" : imgDir + "usn-sea-search.png";
        
        tabHtml = "<div class=\"listheader\">Your opponent's searches</div>";
        if (oppSearches.length == 0) {
            tabHtml += "<div style=\"padding: 8px;\">Your opponent did not search.</div>";
        } else {
            tabHtml += "<table style=\"width: 97%; margin: 0 5px;\">";
            for (var i = 0; i < oppSearches.length; i++) {
                var searchImgSrc = airPath;
                if (oppSearches[i].SearchType == "sea") {
                    searchImgSrc = seaPath;
                }

                var zones = "";
                if (oppSearches[i].Markers.length) {
                    zones = "<span style=\"color: #ffd651;\">Ships sighted at ";
                    for (var j = 0; j < oppSearches[i].Markers.length; j++) {
                        zones += oppSearches[i].Markers[j].Zone + ", ";
                    }
                    zones = zones.substr(0, zones.length - 2) + "</span>";
                }
                tabHtml += "<tr id=\"" + oppSearches[i].Area + "\" class=\"oppsearchitem\"><td style=\"width: 40%;\">" +
                    "<img class=\"oppsearchimg\" src=\"" + searchImgSrc + "\" /></td><td>Area " + oppSearches[i].Area +
                    "<br />" + zones + "</td></tr>";
            }
            tabHtml += "</table>";
        }

        // Air Operations
        tabHtml += "<div class=\"listheader\">Air Operations</div><div id=\"airopslist\" style=\"padding: 8px;\">";
        if (aircraftSources.length == 0) {
            tabHtml += "You have no aircraft ready for operations.";
        } else {
            tabHtml += getAirOpsHtml();
        }
        tabHtml += "</div>";
    }
    $("#airops").html(tabHtml);
}

/*---------------------------------------------------------------------------*/
/* Once and done at the load of this page: load array of zones containing an */
/* aircraft carrier or an airbase, copying data for aircraft availability    */
/* array aircraftSources[] from the ships array.                             */
/*---------------------------------------------------------------------------*/
function loadAircraftSources() {
    landingZones = [];
    aircraftSources = [];

    for (var i = 0; i < ships.length; i++) {
        var ship = ships[i];

        if (canHasAircraft(ship)) {
            if (!$.inArray(ship.Location, landingZones)) {
                landingZones.push(ship.Location);
            }

            if (ship.AircraftState == 2) {
                var sourceId = ship.ShipType == "BAS" ? ship.AirbaseId : ship.ShipId;
                var avail = {
                    SourceId: sourceId,
                    ElementId: ship.ShipType + "-" + sourceId,
                    SourceType: ship.ShipType,
                    Name: ship.Name,
                    Location: ship.Location,
                    AircraftState: ship.AircraftState,
                    TSquadrons: ship.TSquadrons,
                    FSquadrons: ship.FSquadrons,
                    DSquadrons: ship.DSquadrons
                };

                aircraftSources.push(avail);
            }
        }
    }
}

/*-------------------------------------------------------------------*/
/* Highlight the area of an opponent's search item.                  */
/*-------------------------------------------------------------------*/
function showOppSearchedArea(target) {
    if (!window.mapImg) {
        window.mapImg = searchGrid.grabImageData();
        var area = $(target).text().substr(5, 2);
        if (area) searchGrid.drawOppSearchArea(area);
    }
}

/*-------------------------------------------------------------------*/
/* Remove the highlight of an opponent's search item's area.         */
/*-------------------------------------------------------------------*/
function hideOppSearchedArea() {
    if (window.mapImg) {
        searchGrid.restoreImageData(0, mapImg, 0, 0);
        window.mapImg = null;
    }
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
    oppSearches = [];
    var i = searches.length;
    while (i--) {
        if (searches[i].PlayerId != window.player.PlayerId) {
            oppSearches.push(copySearch(searches[i]));
            searches.splice(i, 1);
        }
    }
}

/*---------------------------------------------------------------------------*/
/* Build and return html table for the display of air ops.                   */
/*---------------------------------------------------------------------------*/
function getAirOpsHtml() {
    var addTitle = "Add an operation targeting the selected zone.",
        opsHtml = "<table style=\"width: 100%\"><tr><th>Zone</th><th>Mission</th><th colspan=\"2\">Aircraft</th></tr>";

    for (var i = 0; i < airOps.length; i++) {
        var zone = airOps[i].Zone == "H5G" ? "Midway" : airOps[i].Zone,
            editId = "airopedit-" + i,
            delId = "airopdelete-" + i;
        opsHtml += "<tr><td>" + zone + "</td><td>" + airOps[i].Mission + "</td><td>" + airOps[i].AircraftTotals + "</td>" +
            "<td class=\"right\">" +
            "<img id=\"" + editId + "\" class=\"airopbutton\" title=\"Edit this mission\" src=\"" + imgDir + "editicon.png\" />" +
            "<img id=\"" + delId + "\" class=\"airopbutton\" title=\"Delete this mission\" src=\"" + imgDir + "delicon.png\" />" +
            "</td></tr>";
    }
    opsHtml += "<tr><td><img id=\"airopadd\" class=\"airopbutton\" title=\"" + addTitle + "\" src=\"" + imgDir + "addicon.png\" />" +
            "</td></tr></table>";
    return opsHtml;
}

/*-------------------------------------------------------------------*/
/* Return true if aircraft from startZone can reach the selected     */
/* zone AND return to a friendly ship or airbase without exceeding   */
/* 14 zones of travel. Suicide missions are not permitted (at least  */
/* not on purpose; recovering ship/airbase capacity is ignored here).*/
/*-------------------------------------------------------------------*/
function inAirOpRange(startZone) {
    var zonesOut = searchGrid.zoneDistance(startZone, selectedZone);
    if (zonesOut <= (AIROP_RANGE / 2)) {
        return true;    // able to return from whence they came
    } else {
        for (var i = 0; i < landingZones.length; i++) {
            var zonesBack = searchGrid.zoneDistance(selectedZone, landingZones[i]);
            if (zonesOut + zonesBack <= AIROP_RANGE) return true;    // able to return here
        }
        return false;
    }
}

/*-------------------------------------------------------------------*/
/* Return 0 if the selected zone contains no known ship or airbase   */
/* or only those of the enemy; 1 if it contains friendly ship(s); 2  */
/* if it contains friendly carrier(s) or airbase.                    */
/*-------------------------------------------------------------------*/
function getTargetFriendliesStatus() {
    var status = 0;
    for (var i = 0; i < window.ships.length; i++) {
        var ship = window.ships[i];
        if (ship.Location == selectedZone) {
            if ($.inArray(ship.ShipType, ["CV", "CVL", "BAS"])) {
                status = 2;
                break;
            } else {
                status = 1;
            }
        }
    }
    return status;
}

/*-------------------------------------------------------------------*/
/* Return true if input ship is an on-map aircraft carrier or        */
/* airbase.                                                          */
/*-------------------------------------------------------------------*/
function canHasAircraft(ship) {
    return ($.inArray(ship.ShipType, ["CV", "CVL", "BAS"]) > -1 && $.inArray(ship.Location, ["DUE", "OFF", "SNK"]) == -1);
}

/*-------------------------------------------------------------------*/
/* Build and return a collection of aircraft sources (ships or       */
/* airbase with ready aircraft) within air op range of the selected  */
/* zone.                                                             */
/*-------------------------------------------------------------------*/
function getNewMissionAircraftSources(mission) {
    var sources = [];
    
    for (var i = 0; i < aircraftSources.length; i++) {
        var ship = aircraftSources[i];
        if (inAirOpRange(ship.Location, selectedZone)) {
            var aircraftCount = mission == "CAP" ? ship.FSquadrons : ship.TSquadrons + ship.FSquadrons + ship.DSquadrons;
            if (aircraftCount > 0) sources.push(ship);
        }
    }
    return sources;
}

/*---------------------------------------------------------------------------*/
/* Locate and return the aircraft sources element for the input id.          */
/*---------------------------------------------------------------------------*/
function getAircraftSourceById(sourceId, isAirbase) {
    for (var i = 0; i < aircraftSources.length; i++) {
        if (aircraftSources[i].SourceId == sourceId) {
            if (aircraftSources[i].SourceType == "BAS" && isAirbase) return aircraftSources[i];
            if (aircraftSources[i].SourceType != "BAS" && !isAirbase) return aircraftSources[i];
        }
    }
    return null;
}
/*---------------------------------------------------------------------------*/
/* Locate and return the air operation sources element for the input id.     */
/*---------------------------------------------------------------------------*/
function getAirOpSourceById(sourceId, isAirbase) {
    var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx];
    
    for (var i = 0; i < op.AirOpSources.length; i++) {
        if (op.AirOpSources[i].SourceId == sourceId) {
            if (op.AirOpSources[i].SourceType == "BAS" && isAirbase) return op.AirOpSources[i];
            if (op.AirOpSources[i].SourceType != "BAS" && !isAirbase) return op.AirOpSources[i];
        }
    }
    return null;
}

/*---------------------------------------------------------------------------*/
/* Return HTML string for mission option based on input mission type.        */
/*---------------------------------------------------------------------------*/
function getMissionOptionHtml(mission) {
    switch (mission) {
        case "Attack":
            return "<option value=\"Attack\" title=\"Launch an air attack against ships in the selected zone\">Attack</option>";
        case "CAP":
            return "<option value=\"CAP\" title=\"Protect friendly ships in the selected zone from air attack\">CAP</option>";
        case "Relocate":
            return "<option value=\"Relocate\" title=\"Move aircraft to a friendly ship or airbase in the selected zone\">Relocate</option>";
    }
    return "";
}
/*---------------------------------------------------------------------------*/
/* Determine and set the contents of the mission select list and its         */
/* selected item based on existing missions to the selected zone and the     */
/* presence of friendlies there.                                             */
/*---------------------------------------------------------------------------*/
function getMissionOptions() {
    var sameZoneMissions = [],
        newMissions = [],
        defMission = "",
        i,
        selectHtml = "";
    
    for (i = 0; i < airOps.length; i++) {
        if (airOps[i].Zone == selectedZone) {
            sameZoneMissions.push(airOps[i].Mission);
        }
    }
    
    if ($.inArray("Attack", sameZoneMissions) == -1) {
        newMissions.push("Attack");
        defMission = "Attack";
    }

    var status = getTargetFriendliesStatus(selectedZone);
    if (status > 0) {
        if ($.inArray("CAP", sameZoneMissions) == -1) {
            newMissions.push("CAP");
            defMission = "CAP";
        }
        if (status == 2 && $.inArray("Relocate", sameZoneMissions) == -1) {
            newMissions.push("Relocate");
            if (defMission != "CAP") defMission = "Relocate";
        }
    }

    if (defMission == "CAP" && newMissions.length > 1) {
        //Check to see that there are fighters available for the mission.
        var fsquads = 0;
        for (i = 0; i < aircraftSources.length; i++) {
            if (inAirOpRange(aircraftSources[i].Location, selectedZone)) {
                fsquads += aircraftSources[i].FSquadrons;
            }
        }
        if (fsquads == 0) {
            //No fighters; dump cap from the missions list
            i = 0;
            while (newMissions[i] != "CAP") {
                i++;
            }
            newMissions.splice(i, 1);
            defMission = newMissions[newMissions.length - 1];
        }
    }

    for (i = 0; i < newMissions.length; i++) {
        selectHtml += getMissionOptionHtml(newMissions[i]);
    }
    
    $("#airopmission").html(selectHtml);
    $("#airopmission").val(defMission);
    
    if (selectHtml == "") {
        showAlert("Add Air Operation", "No further mission types are availabe for the selected zone.", DLG_OK, "red");
        return false;
    } else {
        return true;
    }
}

/*---------------------------------------------------------------------------*/
/* Build and return the html for the mission row of aircraft on the air op   */
/* dialog. If the mission being edited is CAP, only fighters are included.   */
/*---------------------------------------------------------------------------*/
function getAirOpMissionRowHtml() {
    var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx],
        isCap = (op.Mission == "CAP"),
        tsquads = 0,
        fsquads = 0,
        dsquads = 0,
        rowHtml = "<tr><td colspan=\"2\" class=\"right\" style=\"width: 25%; font-weight: bold;\">Mission aircraft:</td>",
        i;
    
    //get totals for each aircraft type on the mmission
    for (i = 0; i < op.AirOpSources.length; i++) {
        tsquads += op.AirOpSources[i].TSquadrons;
        fsquads += op.AirOpSources[i].FSquadrons;
        dsquads += op.AirOpSources[i].DSquadrons;
    }

    for (i = 0; i < planeTypes.length; i++) {
        if (isCap && planeTypes[i] != "F") continue;
        var squads = planeTypes[i] == "T" ? tsquads : planeTypes[i] == "F" ? fsquads : dsquads;
        rowHtml += "<td colspan=\"2\" class=\"missionplanes\"><img src=\"" + imgDir + side +
            "ops" + planeTypes[i] + ".png\" /><div id=\"mission" + planeTypes[i] + "\" class=\"srcnumplanes\">" + squads + "</div></td>";
    }
    if (isCap)
        return rowHtml + "<td colspan=\"5\"></td></tr>";
    else
        return rowHtml + "<td></td></tr>";
}

/*---------------------------------------------------------------------------*/
/* Build and return the html for a source row of aircraft on the air op      */
/* dialog. If isCap is true, only fighters are presented.                    */
/*---------------------------------------------------------------------------*/
function getAirOpSourceRowHtml(opSource) {
    var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx],
        isCap = (op.Mission == "CAP"),
        source = getAircraftSourceById(opSource.SourceId, opSource.SourceType == "BAS"),
        rowHtml = "<tr><td class=\"shipname\">" + source.Name + "</td><td class=\"updown\"><a href=\"#\" class=\"updownas\">" +
            "<img src=\"" + imgDir + "updown.png\" id=\"" + source.ElementId + "\" /></a></td>",
        i;

    
    for (i = 0; i < planeTypes.length; i++) {
        if (isCap && planeTypes[i] != "F") continue;
        var availSquads = planeTypes[i] == "T" ? source.TSquadrons : planeTypes[i] == "F" ? source.FSquadrons : source.DSquadrons;
        rowHtml += "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "ops" + planeTypes[i] + ".png\" />" +
                "<div id=\"" + source.ElementId + "-" + planeTypes[i] + "-num\" class=\"srcnumplanes\">" + availSquads + "</div></td>" +
                "<td class=\"updown\"><a href=\"#\" class=\"updowna\">" +
                "<img src=\"" + imgDir + "updown.png\" id=\"" + source.ElementId + "-" + planeTypes[i] + "\" /></a></td>";
    }
    if (isCap)
        rowHtml += "<td colspan=\"5\"></td></tr>";
    else 
        rowHtml += "<td></td></tr>";
        
    return rowHtml;
}

/*---------------------------------------------------------------------------*/
/* Display air operation aircraft and sources on the air operations dialog.  */
/*---------------------------------------------------------------------------*/
function showAirOpSources() {
    var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx],
        dlgHtml = getAirOpMissionRowHtml() +
            "<tr><td colspan=\"2\" class=\"right\" style=\"font-weight: bold\">Available aircraft</td><td colspan=\"4\"></td></tr>";
    
    for (var i = 0; i < op.AirOpSources.length; i++) {
        dlgHtml += getAirOpSourceRowHtml(op.AirOpSources[i]);
    }
    $("#airopplanes").html(dlgHtml);
}

/*---------------------------------------------------------------------------*/
/* Respond to a click on individual source aircraft by moving one squadron   */
/* to or from the mission. Format of event.target.id is                      */
/* <type>-<id>-<plane type>, e.g. 'CV-1-f'.                                  */
/*---------------------------------------------------------------------------*/
function addSquadronToOp(event) {
    if (event.target.id == "") return;

    var planeIdParts = event.target.id.split("-"),
        missionTdSelector = "#mission" + planeIdParts[2],
        numDivSelector = "#" + event.target.id + "-num",
        source = getAircraftSourceById(planeIdParts[1], planeIdParts[0] == "BAS"),
        opSource = getAirOpSourceById(planeIdParts[1], planeIdParts[0] == "BAS"),
        offset = $(event.target).offset(),
        availSquads = source.TSquadrons,
        takenSquads = opSource.TSquadrons,
        adding = ((event.clientY - offset.top) < (event.target.offsetHeight / 2)),
        squadsToAdd = 0;
    
    if (planeIdParts[2] == "F") {
        availSquads = source.FSquadrons;
        takenSquads = opSource.FSquadrons;
    } else if (planeIdParts[2] == "D") {
        availSquads = source.DSquadrons;
        takenSquads = opSource.DSquadrons;
    }
    
    if (adding) {
        // add one squad to the mission
        if (availSquads > 0) {
            squadsToAdd = 1;
            availSquads--;
            takenSquads++;
        }
    } else {
        //remove one squadron
        if (takenSquads > 0) {
            squadsToAdd = -1;
            availSquads++;
            takenSquads--;
        }
    }
    if (planeIdParts[2] == "T") {
        source.TSquadrons = availSquads;
        opSource.TSquadrons = takenSquads;
    } else if (planeIdParts[2] == "F") {
        source.FSquadrons = availSquads;
        opSource.FSquadrons = takenSquads;
    } else {
        source.DSquadrons = availSquads;
        opSource.DSquadrons = takenSquads;
    }
    $(numDivSelector).text(availSquads.toString());
    $(missionTdSelector).text(textAdd($(missionTdSelector).text(), squadsToAdd));
}

/*---------------------------------------------------------------------------*/
/* Respond to a click on a source ship by moving all its aircraft to the     */
/* mmission. If all aircraft are already on the mission, bring them all back.*/
/* Format of event.target.id is <type>-<id>, e.g. 'CV-1'                     */
/*---------------------------------------------------------------------------*/
function addShiploadToOp(event) {
    if (event.target.id == "") return;
    
    var shipIdParts = event.target.id.split("-"),
        source = getAircraftSourceById(shipIdParts[1], shipIdParts[0] == "BAS"),
        opSource = getAirOpSourceById(shipIdParts[1], shipIdParts[0] == "BAS"),
        offset = $(event.target).offset(),
        adding = ((event.clientY - offset.top) < (event.target.offsetHeight / 2)),
        availSquads,
        squadsToAdd;

    //Add/remove all ship's aircraft
    for (var i = 0; i < 3; i++) {
        if ($("#airopmission").val() == "CAP" && planeTypes[i] != "F") continue;

        var numDivSelector = "#" + source.ElementId + "-" + planeTypes[i] + "-num",
            numTdSelector = "#mission" + planeTypes[i];

        if (adding) {
            if (planeTypes[i] == "T") {
                squadsToAdd = source.TSquadrons;
                opSource.TSquadrons += source.TSquadrons;
                availSquads = source.TSquadrons = 0;
            } else if (planeTypes[i] == "F") {
                squadsToAdd = source.FSquadrons;
                opSource.FSquadrons += source.FSquadrons;
                availSquads = source.FSquadrons = 0;
            } else {
                squadsToAdd = source.DSquadrons;
                opSource.DSquadrons += source.DSquadrons;
                availSquads = source.DSquadrons = 0;
            }
        } else {
            if (planeTypes[i] == "T") {
                squadsToAdd = -opSource.TSquadrons;
                source.TSquadrons += opSource.TSquadrons;
                availSquads = source.TSquadrons;
                opSource.TSquadrons = 0;
            } else if (planeTypes[i] == "F") {
                squadsToAdd = -opSource.FSquadrons;
                source.FSquadrons += opSource.FSquadrons;
                availSquads = source.FSquadrons;
                opSource.FSquadrons = 0;
            } else {
                squadsToAdd = -opSource.DSquadrons;
                source.DSquadrons += opSource.DSquadrons;
                availSquads = source.DSquadrons;
                opSource.DSquadrons = 0;
            }
        }
        $(numDivSelector).text(availSquads.toString());
        $(numTdSelector).text(textAdd($(numTdSelector).text(), squadsToAdd));
    }
}

/*---------------------------------------------------------------------------*/
/* Hide the air operations dialog div.                                       */
/*---------------------------------------------------------------------------*/
function closeOpDialog(e) {
    e.stopPropagation();
    $("#dlgairops").css("display", "none");
    $("#dlgoverlay").css("display", "none");
}

/*---------------------------------------------------------------------------*/
/* Build up new air op and its sources based on mission type. If there are   */
/* no sources with aircraft, message the player.                             */
/*---------------------------------------------------------------------------*/
function getNewOp() {
    newOp = {
            Turn: game.Turn,
            Zone: selectedZone,
            Mission: $("#airopmission").val(),
            AircraftTotals: "",
            AirOpSources: []
    };
    var aircraftSources = getNewMissionAircraftSources($("#airopmission").val());
    if (aircraftSources.length == 0) {
        var msg = "No aircraft are available for a mission targeting the selected zone.<br /><br />";
        if (airOps.length > 0)
            msg += "Planes within range, if any, have all been allocated to other missions.";
        else
            msg += "No ready aircraft are within range.";

        showAlert("No Aircraft Available", msg, DLG_OK, "red");
        return false;
    }
    // construct AirOpSources array from source ships
    for (var i = 0; i < aircraftSources.length; i++) {
        var opSource = {
            SourceType: aircraftSources[i].SourceType,
            SourceId: aircraftSources[i].SourceId,
            TSquadrons: 0,
            FSquadrons: 0,
            DSquadrons: 0
        };
        newOp.AirOpSources.push(opSource);
    }
    return true;
}

/*---------------------------------------------------------------------------*/
/* Show air op dialog and capture data for new (if editingOpIdx == -1) or    */
/* existing op. Update and display this and any other ops in the table on    */
/* the AirOps tab if the player clicks "OK".                                 */
/*---------------------------------------------------------------------------*/
function addEditAirOperation() {
    // set up the dialog elements
    $("#airopzone").text(selectedZone);
    if (editingOpIdx > -1) {    //editing an existing op
        selectZone(searchGrid.zoneToTopLeftCoords(airOps[i].Zone));
        $("#airopmission").html(getMissionOptionHtml(airOps[i].Mission));
    } else {    //new op
        if (!getMissionOptions()) return;
        if (!getNewOp()) return;
    }
    showAirOpSources();
    
    $("#dlgairops").css("display", "block")
        .draggable({
            handle: ".floathead",
            containment: "#pagediv",
            scroll: false
        });
    
    // show it
    $("#dlgoverlay").css("display", "block").focus();
}

/*---------------------------------------------------------------------------*/
/* Calculate aircraft totals for the edited op and display the result on the */
/* AirOps tab.                                                               */
/*---------------------------------------------------------------------------*/
function saveAirOperation() {
    var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx],
        ttotal = 0,
        ftotal = 0,
        dtotal = 0;

    op.AircraftTotals = "";

    for (var i = 0; i < op.AirOpSources.length; i++) {
        ttotal += op.AirOpSources[i].TSquadrons;
        ftotal += op.AirOpSources[i].FSquadrons;
        dtotal += op.AirOpSources[i].DSquadrons;
    }
    
    if (ttotal + ftotal + dtotal == 0) {
        if (editingOpIdx > -1) deleteAirOperation();
        return;
    }
    
    if (ttotal > 0) op.AircraftTotals += "  T" + ttotal;
    if (ftotal > 0) op.AircraftTotals += "  F" + ftotal;
    if (dtotal > 0) op.AircraftTotals += "  D" + dtotal;

    if (editingOpIdx == -1) airOps.push(op);
    $("#airopslist").html(getAirOpsHtml());
    window.editsMade = true;
}

/*---------------------------------------------------------------------------*/
/* Delete the air operation element in airOps[] indicated by editingOpIdx    */
/* and redraw the air operations list on the AirOps tab.                     */
/*---------------------------------------------------------------------------*/
function deleteAirOperation() {
    showAlert("Delete Air Operation", "Are you sure you want to delete this mission?", DLG_YESNO, "blue", function (btnText) {
        if (btnText == "Yes") {
            //restore aircraft in the op to their sources
            var op = editingOpIdx == -1 ? newOp : airOps[editingOpIdx];
            for (var i = 0; i < op.AirOpSources.length; i++) {
                var aircraftSource = getAircraftSourceById(op.AirOpSources[i].SourceId, op.AirOpSources[i].SourceType == "BAS");
                aircraftSource.TSquadrons += op.AirOpSources[i].TSquadrons;
                aircraftSource.FSquadrons += op.AirOpSources[i].FSquadrons;
                aircraftSource.DSquadrons += op.AirOpSources[i].DSquadrons;
            }
            
            //delete the mission from the airOps array and redisplay
            if (editingOpIdx > -1) {
                airOps.splice(editingOpIdx, 1);
                $("#airopslist").html(getAirOpsHtml());
            }
            window.editsMade = true;
        }
    });
}

    


