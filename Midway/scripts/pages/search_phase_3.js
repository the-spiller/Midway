﻿
// Events and functions for Phase 3 (Air Ops)

var oppSearches = [],
    mouseOverSearchItem = false,
    airops = [],
    AIROP_RANGE = 14,
    landingZones = [],
    aircraftSources = [];

$(document).on("mouseover", ".oppsearchitem", function (e) {
    mouseOverSearchItem = true;
    showOppSearchedArea(e.target);
}).on("mouseout", ".oppsearchitem", function() {
    mouseOverSearchItem = false;
    hideOppSearchedArea();
}).on("mouseover", ".oppsearchimg", function(e) {
    showOppSearchedArea(e.target.parentNode.parentNode);
}).on("mouseout", ".oppsearchimg", function() {
    hideOppSearchedArea();
}).on("click", "#airopadd", function () {
    addAirOperation();
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

/*-------------------------------------------------------------------*/
/* Highlight the area of an opponent's search item.                  */
/*-------------------------------------------------------------------*/
function showOppSearchedArea(target) {
    if (!window.mapImg) {
        window.mapImg = searchGrid.grabImageData();
        var area = $(target).text().substr(5, 2);
        if (area)
            searchGrid.drawOppSearchArea(area);
    }
}

/*-------------------------------------------------------------------*/
/* Remove the highlight of an opponent's search item's area.         */
/*-------------------------------------------------------------------*/
function hideOppSearchedArea() {
    if (window.mapImg) {
        searchGrid.restoreImageData(mapImg, 0, 0);
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
    var addTitle = "Add an operation targeting the currently selected zone.",
        opsHtml = "<table style=\"width: 100%\"><tr><th>Zone</th><th>Mission</th><th colspan=\"2\">Aircraft</th></tr>";

    for (var i = 0; i < airops.length; i++) {
        var zone = airops[i].Zone == "H5G" ? "Midway" : airops[i].Zone;
        opsHtml += "<tr><td>" + zone + "</td><td>" + airops[i].Mission + "</td><td>" + airops[i].AircraftTotals + "</td>" +
            "<td class=\"right\">" +
            "<img id=\"airopedit\" class=\"airopbutton\" title=\"Edit this mission\" src=\"" + imgDir + "editicon.png\" />" +
            "<img id=\airopdelete\" class=\"airopbutton\" title=\"Delete this mission\" src=\"" + imgDir + "delicon.png\" />" +
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
function getTargetStatus() {
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
function getAircraftSourceShips(mission) {
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

/*-------------------------------------------------------------------*/
/* Load array of zones containing an aircraft carrier or an airbase, */
/* copying data for aircraft availability array from the ships array.*/
/*-------------------------------------------------------------------*/
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
                    ElementId: ship.ShipType + "-" + sourceId + "-avail",
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
/* Locate and return the aircraft sources row for the input id.      */
/*-------------------------------------------------------------------*/
function getAircraftSourceById(sourceId, isAirbase) {
    for (var i = 0; i < aircraftSources.length; i++) {
        if (aircraftSources[i].SourceId == sourceId) {
            if (aircraftSources[i].SourceType == "BAS" && isAirbase) return aircraftSources[i];
            if (aircraftSources[i].SourceType != "BAS" && !isAirbase) return aircraftSources[i];
        }
    }
    return null;
}

/*-------------------------------------------------------------------*/
/* Determine and set the contents of the mission select list and its */
/* selected item based on existing missions to the selected zone and */
/* the presence of friendlies there.                                 */
/*-------------------------------------------------------------------*/
function getMissionOptions() {
    var existingMissions = [],
        selectHtml = "",
        defMission = "";
    
    for (var i = 0; i < airops.length; i++) {
        if (airops[i].Zone == selectedZone) {
            existingMissions.push(airops[i].Mission);
        }
    }
    
    if ($.inArray("Attack", existingMissions) == -1) {
        selectHtml += "<option value=\"Attack\" title=\"Launch an air attack against ships in the selected zone\">Attack</option>";
        defMission = "Attack";
    }

    var status = getTargetStatus(selectedZone);
    if (status > 0) {
        if ($.inArray("CAP", existingMissions) == -1) {
            selectHtml += "<option value=\"CAP\" title=\"Protect friendly ships in the selected zone from air attack\">CAP</option>";
            defMission = "CAP";
        }
        if (status == 2 && $.inArray("Relocate", existingMissions) == -1) {
            selectHtml += "<option value=\"Relocate\" title=\"Move aircraft to a friendly ship or airbase in the selected zone\">Relocate</option>";
            if (defMission != "CAP") defMission = "Relocate";
        }
    }

    $("#airopmission").html(selectHtml);
    $("#airopmission").val(defMission);
    
    if (selectHtml == "") {
        showAlert("Add Air Operation", "No further mission types are availabe for the selected zone.", DLG_OK, "red");
    }
    return (selectHtml != "");
}

/*-------------------------------------------------------------------*/
/* Build and return the html for a row of aircraft on the air op     */
/* dialog. If source is null, the row is presumed to be for the      */
/* planes assigned to the mission and all counts will be zero. If    */
/* isSource is true, the ship name and plane icons are presented as  */
/* clickable. If mission == "CAP" only fighters are included.        */
/*-------------------------------------------------------------------*/
function getAirOpAircraftHtml(source, mission) {
    var fightersHtml,
        rowHtml = "";
    
    if (!source) {
        rowHtml += "<tr><td class=\"right\" style=\"width: 25%; font-weight: bold;\">Mission aircraft:</td>";
        fightersHtml = "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opsf.png\" />" +
            "<div id=\"missionf\" class=\"srcnumplanes\">0</div></td>";
        
        if (mission == "CAP") {
            rowHtml += fightersHtml + "<td colspan=\"3\"></td></tr>";
        } else {
            rowHtml += "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opst.png\" />" +
                "<div id=\"missiont\" class=\"srcnumplanes\">0</div></td>" +
                fightersHtml +
                "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opsd.png\" />" +
                "<div id=\"missiond\" class=\"srcnumplanes\">0</div></td><td></td></tr>";
        }
    } else {
        rowHtml += "<tr><td id=\"op" + source.SourceType + "-"  + source.SourceId + "\" class=\"shipname right\">" + source.Name + ":</td>";
        fightersHtml = "<td id=\"" + source.ElementId + "f\" class=\"missionplanes clickme\"><img src=\"" + imgDir + side + "opsf.png\" />" +
                "<div class=\"srcnumplanes\">" + source.FSquadrons + "</div></td>";
        
        if (mission == "CAP")
        {
            rowHtml += fightersHtml + "<td colspan=\"3\"></td></tr>";
        } else {
            rowHtml += "<td id=\"" + source.ElementId + "t\" class=\"missionplanes clickme\">" +
                "<img src=\"" + imgDir + side + "opst.png\" /><div class=\srcnumplanes\">" + source.TSquadrons + "</div></td>" + fightersHtml +
                "<td id=\"" + source.ElementId + "d\" class=\"missionplanes clickme\">" +
                "<img src=\"" + imgDir + side + "opsd.png\" /><div class=\srcnumplanes\">" + source.DSquadrons + "</div></td><td></td></tr>";
        }
    }
    return rowHtml;
}

/*-------------------------------------------------------------------*/
/* Show air op dialog and capture data for new op. Display new op in */
/* table on AirOps tab if the player clicks "OK".                    */
/*-------------------------------------------------------------------*/
function addAirOperation() {
    var sources = [],
        caption = "Add Air Operation",
        showSourceShips = function () {
            sources = getAircraftSourceShips($("#airopmission").val());
            if (sources.length == 0) {
                var msg = "No aircraft are available for a mission targeting the selected zone." +
                    "<p>Planes within range, if any, have all been allocated to other missions.</p>";
                showAlert(caption, msg, DLG_OK, "red");
                return false;
            }
            var html = getAirOpAircraftHtml(null, $("#airopmission").val());
            html += "<tr><td class=\"right\" style=\"font-weight: bold\">Available aircraft</td><td colspan=\"4\"></td></tr>";
            
            for (var i = 0; i < sources.length; i++) {
                html += getAirOpAircraftHtml(sources[i], $("#airopmission").val());
            }
            $("#airopplanes").html(html);
            
            $(".missionplanes").on("click", function (e) {
                addSquadronToOp(e.target.parentNode);
            });

            $(".shipname").on("click", function(e) {
                addShipLoadToOp(e.target);
            });
            
            return true;
        },
        addSquadronToOp = function (planeTd) {
            // Respond to a click on individual source aircraft by moving one squadron to the mission. If all planes of this
            // type on this ship are already in the mission, bring them all back out.
            if (planeTd.id == "") return;
            
            var planeType = planeTd.id.substr(planeTd.id.length - 1, 1),
                missionTdId = "#mission" + planeType,
                dashPos1 = planeTd.id.indexOf("-"),
                dashPos2 = planeTd.id.indexOf("-", dashPos1 + 1),
                shipType = planeTd.id.substr(0, dashPos1),
                shipAirbaseId = planeTd.id.substr(dashPos1 + 1, dashPos2 - (dashPos1 + 1)),
                source = getAircraftSourceById(shipAirbaseId, shipType == "BAS"),
                squads = planeType == "f" ? source.FSquadrons : (planeType == "t" ? source.TSquadrons : source.DSquadrons);
            
            if ($("#" + planeTd.id + " div").text() == "0") {
                // remove planes from mission
                $("#" + planeTd.id + " div").text(squads);
                $(missionTdId).text(textAdd($(missionTdId).text(), -squads));
            } else {
                // add one squad to the mission
                $("#" + planeTd.id + " div").text(textAdd($("#" + planeTd.id + " div").text(), -1));
                $(missionTdId).text(textAdd($(missionTdId).text(), 1));
            }
        },
        addShipLoadToOp = function (shipTd) {
            // Respond to a click on a source ship by moving all its aircraft to the mmission. If all aircraft are
            // alreay on the mission, bring them all back.
            var shipAirbaseId = shipTd.id.substr(shipTd.id.indexOf("-") + 1),
                source = getAircraftSourceById(shipAirbaseId, shipTd.id.indexOf("opBAS") > -1),
                planeTypes = ["t", "f", "d"],
                planeDivId,
                planesLeft = 0,
                i;

            //Total up the ship's remaining aircraft
            for (i = 0; i < 3; i++) {
                if ($("#airopmission").val() == "CAP" && planeTypes[i] != "f") continue;
                planeDivId = "#" + source.ElementId + planeTypes[i] + " div";
                planesLeft += Number($(planeDivId).text());
            }

            //Move all ship's aircraft based on result of above
            for (i = 0; i < 3; i++) {
                if ($("#airopmission").val() == "CAP" && planeTypes[i] != "f") continue;
                
                planeDivId = "#" + source.ElementId + planeTypes[i] + " div";
                if (planesLeft == 0) {
                    // bring 'em all back
                    var squads = planeTypes[i] == "t" ? source.TSquadrons : (planeTypes[i] == "f" ? source.FSquadrons : source.DSquadrons);
                    $(planeDivId).text(squads);
                    $("#mission" + planeTypes[i]).text(textAdd($("#mission" + planeTypes[i]).text(), -squads));
                } else {
                    // send 'em all up
                    squads = Number($(planeDivId).text());
                    $(planeDivId).text("0");
                    $("#mission" + planeTypes[i]).text(textAdd($("#mission" + planeTypes[i]).text(), squads));
                }
            }
        },
    closeOpDialog = function(e) {
            e.stopPropagation();
            $("#dlgairops").css("display", "none");
            $("#dlgoverlay").css("display", "none");
        };
    
    // set up the dialog
    var bg = "linear-gradient(to right, #093a67, #093a67, #093a67, #2e2e2e)";
    if (side == "IJN")
        bg = "linear-gradient(to right, #8f0000, #8f0000, #8f0000, #2e2e2e)";
    
    $("#airophead").css("background", bg).html(caption);
    $("#airopzone").text(selectedZone);

    if (getMissionOptions(selectedZone)) {
        if (showSourceShips()) {
            $("#dlgairops").css("display", "block")
                .draggable({
                    handle: "#airophead",
                    containment: "#pagediv",
                    scroll: false
                });

            //events
            $("#airopclose").on("click", function(e) {
                closeOpDialog(e);
            });
            $("#airopmission").on("change", function() {
                showSourceShips();
            });
            $("#dlgairops .flatbutton").on("click", function(e) {
                closeOpDialog(e);
                if (e.target.innerHTML == "OK") {
                    // add the op to our collection and display it
                    var op = {
                            Zone: selectedZone,
                            Mission: $("#airopmission").val(),
                            AircraftTotals: "",
                            AirOpAircraft: []
                        },
                        ttotal = 0,
                        ftotal = 0,
                        dtotal = 0;

                    for (var i = 0; i < sources.length; i++) {
                        var sourceType = sources[i].SourceType,
                            sourceId = sources[i].SourceId,
                            selector = "#" + sources[i].ElementId,
                            tSquadsTaken = $(selector + "t div").length ? sources[i].TSquadrons - Number($(selector + "t div").text()) : 0,
                            fSquadsTaken = $(selector + "f div").length ? sources[i].FSquadrons - Number($(selector + "f div").text()) : 0,
                            dSquadsTaken = $(selector + "d div").length ? sources[i].DSquadrons - Number($(selector + "d div").text()) : 0;

                        if (tSquadsTaken + fSquadsTaken + dSquadsTaken == 0) return;
                        
                        // remove these planes from those available
                        sources[i].TSquadrons -= tSquadsTaken;
                        sources[i].FSquadrons -= fSquadsTaken;
                        sources[i].DSquadrons -= dSquadsTaken;

                        // keep running total of squads of each aircraft type in the mission
                        ttotal += tSquadsTaken;
                        ftotal += fSquadsTaken;
                        dtotal += dSquadsTaken;

                        var aircraft = {
                            SourceId: sourceId,
                            SourceType: sourceType,
                            TSquadrons: tSquadsTaken,
                            FSquadrons: fSquadsTaken,
                            DSquadrons: dSquadsTaken
                        };
                        op.AirOpAircraft.push(aircraft);
                    }
                    if (ttotal > 0) op.AircraftTotals += "  T" + ttotal;
                    if (ftotal > 0) op.AircraftTotals += "  F" + ftotal;
                    if (dtotal > 0) op.AircraftTotals += "  D" + dtotal;

                    airops.push(op);
                    $("#airopslist").html(getAirOpsHtml());
                    window.editsMade = true;
                }
            });
            //go
            $("#dlgoverlay").css("display", "block").focus();
        }
    }
}


    


