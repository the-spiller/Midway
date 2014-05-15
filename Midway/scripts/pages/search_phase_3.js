﻿
// Events and functions for Phase 3 (Air Ops)

var oppSearches = [],
    mouseOverSearchItem = false,
    landingZones = [],
    AIROP_RANGE = 14,
    aircraftSources = [],
    airops = [];

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

/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function getAirOpsHtml() {
    var title = "Add an operation targeting the currently selected zone.";
    var html = "<table style=\"width: 97%; margin: 0 5px;\">" +
        "<tr><th>Zone</th><th>Mission</th><th colspan=\"2\">Aircraft<th>";

    for (var i = 0; i < airops.length; i++) {
        html += "<tr><td>" + airops[i].Zone + "</td><td>" + airops[i].Mission + "</td><td></td><td>" +
            "<img id=\"airopedit\" class=\"airopbutton\" title=\"Edit this mission\" src=\"" + imgDir + "editicon.png\">" +
            "<img id=\airopdelete\" class=\"airopbutton\" title=\"Delete this mission\" src=\"" + imgDir + "delicon.png\"></td></tr>";
    }

    html += "<tr><td id=\"lastrow\" colspan=\"4\"><img id=\"airopadd\" class=\"airopbutton\" title=\"" + title + "\" src=\"" +
        imgDir + "addicon.png\"></td></tr></table>";
    
    return html;
}
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
        tabHtml += "<div class=\"listheader\">Air Operations</div>";
        if (aircraftSources.length == 0) {
            tabHtml += "<div style=\"padding: 8px;\">You have no aircraft ready for operations.</div>";
        } else {
            tabHtml += "<div id=\"airopslist\" style=\"padding: 8px;\">" + getAirOpsHtml() + "</div>";
        }
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
/* and while we're at, clone aircraft availability array from ships. */
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
                var avail = {
                    SourceId: ship.ShipType == "BAS" ? ship.AirbaseId : ship.ShipId,
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
/* Locate and return the aircraft availability row for the input Id. */
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
/* selected item based on presence of friendlies in selectedZone.    */
/*-------------------------------------------------------------------*/
function setDefaultOpMission() {
    $("#airopmission").html("<option value=\"Attack\">Attack</option>");

    var status = getTargetStatus(selectedZone);
    if (status > 0) {
        $("#airopmission").append("<option value=\"CAP\">Combat Air Patrol (CAP)</option>");
        if (status == 2) $("#airopmission").append("<option value=\"Relocate\">Relocate</option>");
        $("#airopmission").val("CAP");
    } else {
        $("#airopmission").val("Attack");
    }
}

/*---------------------------------------------------------------------------*/
/* Build up and return the html element id string for a mission aircraft td. */
/*---------------------------------------------------------------------------*/
function getAirOpSourceId(source) {
    return source.SourceType + "-" + source.SourceId + "-avail";
}

/*-------------------------------------------------------------------*/
/* Build and return the html for a row of aircraft on the air op     */
/* dialog. If source is null, the row is presumed to be for the      */
/* planes assigned to the mission and all counts will be zero. If    */
/* isSource is true, the ship names and plane icons are presented as */
/* clickable. If mission == "CAP" only fighters are included.        */
/*-------------------------------------------------------------------*/
function getAirOpAircraftHtml(source, mission) {
    var htmlf,
        html = "";
    
    if (!source) {
        html += "<tr><td class=\"right\" style=\"width: 25%; font-weight: bold;\">Mission aircraft:</td>";
        htmlf = "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opsf.png\" />" +
            "<div id=\"missionf\">0</div></td>";
        
        if (mission == "CAP") {
            html += htmlf + "<td colspan=\"3\"></td></tr>";
        } else {
            html += "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opst.png\" /><div id=\"missiont\">0</div></td>" +
                htmlf +
                "<td class=\"missionplanes\"><img src=\"" + imgDir + side + "opsd.png\" /><div id=\"missiond\">0</div></td>" +
                "<td></td></tr>";
        }
    } else {
        var id = getAirOpSourceId(source);
        html += "<tr><td class=\"shipname right clickme\">" + source.Name + ":</td>";
        htmlf = "<td id=\"" + id + "f\" class=\"missionplanes clickme\"><img src=\"" + imgDir + side + "opsf.png\" />" +
                "<div>" + source.FSquadrons + "</div></td>";
        
        if (mission == "CAP")
        {
            html += htmlf + "<td colspan=\"3\"></td></tr>";
        } else {
            html += "<td id=\"" + id + "t\" class=\"missionplanes clickme\"><img src=\"" + imgDir + side + "opst.png\" />" +
                "<div>" + source.TSquadrons + "</div></td>" + htmlf +
                "<td id=\"" + id + "d\" class=\"missionplanes clickme\"><img src=\"" + imgDir + side + "opsd.png\" />" +
                "<div>" + source.DSquadrons + "</div></td><td></td></tr>";
        }
    }
    return html;
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
                showAlert(caption, "No aircraft are available within range of the selected zone.", DLG_OK, "red");
                return false;
            }
            var html = getAirOpAircraftHtml(null, false, $("#airopmission").val());
            html += "<tr><td class=\"right\" style=\"font-weight: bold\">Available aircraft</td><td colspan=\"4\"></td></tr>";
            
            for (var i = 0; i < sources.length; i++) {
                html += getAirOpAircraftHtml(sources[i], true, $("#airopmission").val());
            }
            $("#airopplanes").html(html);
            
            $(".missionplanes").on("click", function (e) {
                addPlaneToOp(e.target.parentNode);
            });
            
            return true;
        },
        addPlaneToOp = function (planeTd) {
            var planeType = planeTd.id.substr(planeTd.id.length - 1, 1),
                missionTdId = "#mission" + planeType,
                dashPos = planeTd.id.indexOf("-"),
                shipType = planeTd.id.substr(0, dashPos),
                shipAirbaseId = planeTd.id.substr(dashPos + 1, planeTd.id.indexOf("-", dashPos + 1) - (dashPos + 1)),
                source = getAircraftSourceById(shipAirbaseId, shipType == "BAS"),
                squads = planeType == "f" ? source.FSquadrons : (planeType == "t" ? source.TSquadrons : source.DSquadrons);
            
            if ($("#" + planeTd.id + " div").text() == "0") {
                // remove planes from mission
                $("#" + planeTd.id + " div").text(squads);
                $(missionTdId).text(textArithmetic($(missionTdId).text(), -squads));
            } else {
                // add one squad to the mission
                $("#" + planeTd.id + " div").text(textArithmetic($("#" + planeTd.id + " div").text(), -1));
                $(missionTdId).text(textArithmetic($(missionTdId).text(), 1));
            }
        },
        closeOpDialog = function(e) {
            e.stopPropagation();
            $("#dlgairops").css("display", "none");
            $("#dlgoverlay").css("display", "none");
        };
    
    var bg = "linear-gradient(to right, #093a67, #093a67, #093a67, #2e2e2e)";
    if (side == "IJN")
        bg = "linear-gradient(to right, #8f0000, #8f0000, #8f0000, #2e2e2e)";
    
    $("#airophead").css("background", bg).html(caption);
    $("#airopzone").text(selectedZone);
    
    setDefaultOpMission(selectedZone);
    
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
        $("#airopmission").on("change", function () {
            showSourceShips();
        });
        $("#dlgairops .flatbutton").on("click", function(e) {
            closeOpDialog(e);
            if (e.target.innerHTML == "OK") {
                // add the op to our collection and display it
                var op = {
                    Zone: selectedZone,
                    Mission: $("#airopmission").val(),
                    AirOpAircraft: []
                };
                for (var i = 0; i < sources.length; i++) {
                    var sourceType = sources[i].SourceType,
                        sourceId = sources[i].SourceId,
                        selector = "#" + getAirOpSourceId(sources[i]),
                        tsquads = sources[i].TSquadrons - Number($(selector + "t div").text()),
                        fsquads = sources[i].FSquadrons - Number($(selector + "f div").text()),
                        dsquads = sources[i].DSquadrons - Number($(selector + "d div").text());

                    sources[i].TSquadrons -= tsquads;
                    sources[i].FSquadrons -= fsquads;
                    sources[i].DSquadrons -= dsquads;
                    
                    var aircraft = {
                        SourceId: sourceId,
                        SourceType: sourceType,
                        TSquadrons: tsquads,
                        FSquadrons: fsquads,
                        DSquadrons: dsquads
                    };
                    op.AirOpAircraft.push(aircraft);
                }
                airops.push(op);
                $("#airopslist").html(getAirOpsHtml());
            }
        });
        //go
        $("#dlgoverlay").css("display", "block").focus();
    }
}


    


