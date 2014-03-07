/*---------------------------------------------------------------*/
/* Search Map page Search Phase functions                        */
/*---------------------------------------------------------------*/
// Indicates a search is being conducted and which type it is.
var searching = "";
// Array of already-searched areas.
var searched = [];
// Array of our ship locations to speed search.
var shipLocations = [];
// id and  Offset for searching image cursor.
var cursorId = "";
var curOffset = { x: 0, y: 0 };
// Search data object
var PostedSearch = { Area: "", Type: "", Markers: [] };

$(document).ready(function () {
    if (pageData.WaitingFlag == "N") {
        // Load search cursor image and set offset that will center mouse within it.
        var img = document.getElementById("airsearchcursor");
        curOffset.x = img.clientWidth / 2;
        curOffset.y = img.clientHeight / 2;

        // Load array of previously-searched areas.
        var i;
        if (pageData.Searches != null) {
            for (i = 0; i < pageData.Searches.length; i++) {
                searched.push(pageData.Searches[i].Area);
            }
        }

        // Load array of our ship locations to speed mousemove function.
        for (i = 0; i < pageData.Locations.length; i++) {
            if (shipsInZone(pageData.Locations[i], true)) {
                shipLocations.push(pageData.Locations[i].Zone);
            }
        }

        $("#stage").on({
            mouseenter: function() {
                if (controlBox.headerIs(controlBox.headerSearch) && $("#search .ui-selected").length > 0 && pageData.WaitingFlag == "N") {
                    searching = $("#search .ui-selected").attr("id").substring(0, 3);
                } else {
                    searching = "";
                }
            },
            mouseleave: function() {
                searching = "";
                if (controlBox.headerIs(controlBox.headerSearch)) {
                    hideSearching();
                }
            },
            mousemove: function(e) {
                if (searching != "") {
                    var mcoords = { x: e.pageX - this.offsetLeft, y: e.pageY - this.offsetTop };
                    var zone = gridCalc.zoneFromPoint({ x: mcoords.x, y: mcoords.y });
                    var rangeOK = false;

                    if (searching == "air") {
                        if (pageData.PlayerSide == "USN") {
                            rangeOK = true;
                            cursorId = "airsearchcursor";
                        } else {
                            for (i = 0; i < shipLocations.length; i++) {
                                if (gridCalc.zonesApart(zone, shipLocations[i]) <= pageData.SearchRange) {
                                    rangeOK = true;
                                    cursorId = "airsearchcursor";
                                    break;
                                }
                            }
                        }
                    } else {
                        // Sea search -- ship locations only.
                        if (ownShipsInArea(zone.substring(0, 2))) {
                            rangeOK = true;
                            cursorId = "seasearchcursor";
                        }
                    }

                    if (rangeOK) {
                        var areacoords = gridCalc.areaTopLeftFromZone(zone);
                        showSearching(areacoords, mcoords);
                    } else {
                        hideSearching();
                    }

                }
            }
        });
        // Enable Done button -- nothing in this phase _must_ be done.
        $("#done").removeAttr("disabled");

        // Make JQuery selectable behave as single-select.
        $("#search").selectable({
            selected: function(event, ui) {
                $(ui.selected).siblings().removeClass("ui-selected");
            }
        });
    } else {
        $("#done").attr("disabled", true);
    }
});

function showSearching(areaCoords, mouseCoords) {
    $("#stage").css("cursor", "none");
    $("#" + cursorId).css({ top: (mouseCoords.y - curOffset.y) + "px", left: (mouseCoords.x - curOffset.x) + "px", visibility: "visible" });
    $("#areaHighlight").css({ top: (areaCoords.y - 1) + "px", left: areaCoords.x + "px", visibility: "visible" });
}

function hideSearching() {
    $("#stage").css("cursor", "auto");
    $("#" + cursorId).css("visibility", "hidden");
    $("#areaHighlight").css("visibility", "hidden");
}

/*--------------------------------*/
/* Returns true if the input area */
/* has one or more of our side's  */
/* ships in it.                   */
/*--------------------------------*/
function ownShipsInArea(area) {
    var ret = false;
    var zone;
    for (var i = 0; i < 9; i++) {
        switch (i) {
            case 0:
                zone = "A";
                break;
            case 1:
                zone = "B";
                break;
            case 2:
                zone = "C";
                break;
            case 3:
                zone = "D";
                break;
            case 4:
                zone = "E";
                break;
            case 5:
                zone = "F";
                break;
            case 6:
                zone = "G";
                break;
            case 7:
                zone = "H";
                break;
            default:
                zone = "I";
                break;
        }
        for (var j = 0; j < shipLocations.length; j++) {
            if (shipLocations[j] == area + zone) {
                ret = true;
                break;
            }
        }
        if (ret) { break; }
    }
    return ret;
}

/*-----------------------------------------------*/
/* User chose an area to search. Check for enemy */
/* ships in each zone, and if any are found, set */
/* a marker on the map and in the data.          */
/*-----------------------------------------------*/
function executeSearch(clickedPoint) {
    if ($("#" + cursorId).css("visibility") == "hidden") {
        return;
    }

    var zone = gridCalc.zoneFromPoint(clickedPoint);
    var area = zone.substring(0, 2);
    var type = $(".ui-selected").attr("class").substring(0, 3);

    // See if this area was already searched.
    for (var i = 0; i < searched.length; i++) {
        if (searched[i] == area) {
            showInfoDialog("YOU HAVE ALREADY SEARCHED AREA " + area);
            return;
        }
    }

    // See if we're using an air search on an area containing our ships.
    if (ownShipsInArea(area) && type == "air") {
        if (!confirm("You are using an air search where a sea search would suffice. Press OK if you wish to continue.")) {
            return;
        }
    }
    // Init search data 
    type = cursorId.substring(0, 3);
    PostedSearch = { Area: area, Type: type, Markers: [] };

    // Loop thru each zone in the area looking for enemy ships.
    for (i = 0; i < 9; i++) {
        zone = area;
        switch (i) {
            case 0:
                zone += "A";
                break;
            case 1:
                zone += "B";
                break;
            case 2:
                zone += "C";
                break;
            case 3:
                zone += "D";
                break;
            case 4:
                zone += "E";
                break;
            case 5:
                zone += "F";
                break;
            case 6:
                zone += "G";
                break;
            case 7:
                zone += "H";
                break;
            default:
                zone += "I";
                break;
        }
        var zoneObj = getZone(zone, false);
        if (shipsInZone(zoneObj, false)) {
            // Found enemy ships: create and load a marker object to describe them (matching the 
            // PostedSearchMarker class on the server).
            var marker =
                {
                    PlacedDTime: pageData.GameDTime,
                    Zone: zone,
                    CVs: 0,
                    CVLs: 0,
                    BBs: 0,
                    CAs: 0,
                    CLs: 0,
                    DDs: 0,
                    Deleted: "N"
                };

            // Get counts of each type of enemy ship found.
            for (var j = 0; j < zoneObj.Ships.length; j++) {
                if (zoneObj.Ships[j].OwningSide != pageData.PlayerSide) {
                    switch (zoneObj.Ships[j].ShipType) {
                        case "CV":
                            marker.CVs++;
                            break;
                        case "BB":
                            marker.BBs++;
                            break;
                        case "CA":
                            marker.CAs++;
                            break;
                        case "CVL":
                            marker.CVLs++;
                            break;
                        case "CL":
                            marker.CLs++;
                            break;
                        default:
                            marker.DDs++;
                            break;
                    }
                }
            }
            PostedSearch.Markers.push(marker);
        }
    }

    // Remove search highlight, restore normal cursor and turn off search indicator.
    hideSearching();
    searching = "";

    // Post search up to the server. If the post fails, permit no more searches
    // (without starting over from the home page).
    postSearch();
}

function postSearch() {
    $.ajax({
        url: "/Search/SaveSearch/" + pageData.GameId,
        type: "POST",
        data: JSON.stringify(PostedSearch),
        contentType: "application/json",
        success: function () {
            postSearchSuccess();
        },
        error: function (jqXHR) {
            postSearchFailure(jqXHR);
        }
    });
}

function postSearchSuccess() {
    searched.push(PostedSearch.Area);

    if (PostedSearch.Markers.length > 0) {
        var marker;
        var tooltip;

        for (var i = 0; i < PostedSearch.Markers.length; i++) {
            marker = PostedSearch.Markers[i];

            // Set a search marker into the working data.
            getZone(marker.Zone, false).SearchMarker = {
                PlacedDTime: pageData.GameDTime,
                CVs: marker.CVs,
                CVLs: marker.CVLs,
                BBs: marker.BBs,
                CAs: marker.CAs,
                CLs: marker.CLs,
                DDs: marker.DDs,
                Deleted: "N"
            };

            // Build up a tooltip string based on its ship counts.
            tooltip = controlBox.markerTooltip(marker);

            // Put the marker on the map.
            placeSearchMarker(marker.Zone, tooltip);
        }
        doSquareSelection(null, marker.Zone);
        controlBox.activateHeader("SEE");
        showInfoDialog("ENEMY SHIPS SIGHTED!");
    } else {
        showInfoDialog("NO SIGHTINGS");
    }

    // Remove selected search from control list.
    $("#search .ui-selected").remove();
}

function postSearchFailure(jqXHR) {
    pageData.WaitingFlag = "Y";
    $("#done").attr("disabled", "disabled");

    if (pageData.Admin == "Y") {
        showErrDialog("UNABLE TO SAVE SEARCH:<br />" + jqXHR.responseText.toUpperCase());
    } else {
        showErrDialog("<p>UNABLE TO SAVE SEARCH:<p>CHEAT PREVENTION REQUIRES THAT SEARCHING CEASE AT THIS TIME. TRY AGAIN LATER.");
    }
}

