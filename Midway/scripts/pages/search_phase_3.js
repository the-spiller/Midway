
// Events and functions for Phase 3 (Air Ops)

var oppSearches = [],
    mouseOverSearchItem = false,
    landingZones = [],
    AIROP_RANGE = 14;

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
function loadAirOpsPhaseTab() {
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
        if (!anyAircraftReady()) {
            tabHtml += "<div style=\"padding: 8px;\">You have no aircraft ready for operations.</div>";
        } else {
            var title = "Add an operation targeting the currently selected zone.";
            tabHtml += "<table style=\"width: 97%; margin: 0 5px;\">" +
                "<tr><th>Zone</th><th>Mission</th><th colspan=\"2\">Aircraft<th>" +
                "<tr><td id=\"lastrow\" colspan=\"4\"><img id=\"airopadd\" class=\"airopbutton\" title=\"" + title + "\" src=\"" +
                imgDir + "addicon.png\"></td></tr></table>";
        }
    }
    $("#airops").html(tabHtml);
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function anyAircraftReady() {
    var ship;
    
    for (var i = 0; i < window.ships.length; i++) {
        ship = window.ships[i];
        if (ship.ShipType == "CV" || ship.ShipType == "CVL" || ship.ShipType == "BAS") {
            if (ship.AircraftState == 2)
                return true;
        }
    }
    return false;
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
/* Return 0 if the selected zone contains no known ship or airbase,  */
/* 1 if it contains friendly ship(s), or 2 if it contains friendly   */
/* carrier(s) or airbase.                                            */
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
    return ($.inArray(ship.ShipType, ["CV", "CVL", "BAS"]) && !$.inArray(ship.Location, ["DUE", "OFF", "SNK"]));
}

/*-------------------------------------------------------------------*/
/* Build and return a collection of aircraft sources (ships or       */
/* airbase with ready aircraft) within air op range of the selected  */
/* zone.                                                             */
/*-------------------------------------------------------------------*/
function getAircraftSourceShips(fightersOnly) {
    var sources = [];
    
    for (var i = 0; i < window.ships.length; i++) {
        var ship = window.ships[i];
        if (ship.AircraftState == 2 && inAirOpRange(ship.Location, selectedZone)) {
            var aircraftCount = fightersOnly ? ship.FSquadrons : ship.TSquadrons + ship.FSquadrons + ship.DSquadrons;
            if (aircraftCount > 0) sources.push(ship);
        }
    }
    return sources;
}

/*-------------------------------------------------------------------*/
/* Load array of zones containing an aircraft carrier or an airbase. */
/*-------------------------------------------------------------------*/
function loadLandingZones() {
    landingZones = [];
    for (var i = 0; i < window.ships.length; i++) {
        var ship = window.ships[i];
        if (canHasAircraft(ship) && !$.inArray(ship.Location, landingZones)) {
            landingZones.push(ship.Location);
        }
    }
}

/*-------------------------------------------------------------------*/
/* 
/*-------------------------------------------------------------------*/
function setDefaultOpMission() {
    $("#airopmission").html("<option value=\"attack\">Attack</option>");

    var status = getTargetStatus(selectedZone);
    if (status > 0) {
        $("#airopmission").append("<option value=\"cap\">Combat Air Patrol</option>");
        if (status == 2) $("#airopmission").append("<option value=\"relocate\">Relocate</option>");
        $("#airopmission").val("cap");
    } else {
        $("#airopmission").val("attack");
    }
}
/*-------------------------------------------------------------------*/
/* Show air op dialog and capture data for new op. Display new op in */
/* table on AirOps tab.                                              */
/*-------------------------------------------------------------------*/
function addAirOperation() {
    var buttonClicked,
        caption = "Add Air Operation",
        showSourceShips = function () {
            $("#airopsources").html("");
            var sources = getAircraftSourceShips(selectedZone, $("#airopmission").val() == "cap");
            if (sources.length == 0) {
                showAlert(caption, "No aircraft are available within range of the selected zone.", DLG_OK, "red");
                return false;
            }
            var html = 
                "<tr><td>Mission aircraft:</td><td class=\"missionplanes\">" +
                "<img src=\"" + imgDir + side + "-ops-planes.png\" />" +
                "<div class=\"tsquads\">0</div><div class=\"fsquads\">0</div><div class=\"dsquads\">0</div></td></tr>" +
                "<tr><td colspan=\"2\">Available aircraft</td></tr>";
            
            for (var i = 0; i < sources.length; i++) {
                var id = sources[i].ShipType + (sources[i].ShipType == "BAS" ? sources[i].AirbaseId : sources[i].ShipId) + "-avail";
                html += "<tr><td>" + sources[i].Name + ":</td><td class=\"missionplanes\">" +
                    "<img src=\"" + imgDir + side + "-ops-planes.png\" />" +
                    "<td id=\"" + id + "t\" class=\"tsquads\">" + sources[i].TSquadrons + "</td>" +
                    "<td id=\"" + id + "f\" class=\"fsquads\">" + sources[i].FSquadrons + "</td>" +
                    "<td id=\"" + id + "d\" class=\"dsquads\">" + sources[i].DSquadrons + "</td></td></tr>";
            }
            $("#airopplanes").append(html);
            return true;
        },
        closeOpDialog = function(e) {
            e.stopPropagation();
            $("#dlgairops").css("display", "none");
            $("#dlgoverlay").css("display", "none");
        };

    $("#airophead").html(caption);
    $("#airopzone").val(selectedZone);
    
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
        $("#dlgairops .flatbutton").on("click", function(e) {
            closeOpDialog(e);
            buttonClicked = e.target.innerHTML;
        });
        $("#airopmission").on("change", function() {
            showSourceShips();
        });
        //go
        $("#dlgoverlay").css("display", "block").focus();
    }
}

$(document).ready(function() {
    loadLandingZones();
});


    


