﻿
// Events and functions for Phase 2 (Search)

$(document).on("mousedown", ".searchitem", function(e) {
    searchItemMouseDown(e);
});

/*-------------------------------------------------------------------*/
/* Load the Search tab with its control elements.                    */
/*-------------------------------------------------------------------*/
function loadPhaseTab() {
    if (game.PhaseId != 2) return;

    var searchHtml = "<div style=\"margin: 5px 0 15px 5px;\">Available searches</div><ul>",
        searchDesc,
        searchImg = imgDir + side.toLowerCase() + "-air-search.png";

    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && !searches[i].Area) {
            if (searches[i].SearchType == "sea") {
                searchDesc = "Drag and drop to search any area containing one of your ships";
                searchImg = imgDir + side.toLowerCase() + "-sea-search.png";
            } else if (game.SearchRange == 0) { //Unlimited
                searchDesc = "Drag and drop to search any area";
            } else {
                searchDesc = "Drag and drop to search any area within " + game.SearchRange + " zones of any of your ships";
            }
            searchHtml += "<li><div id=\"search-" + searches[i].SearchNumber + "\" class=\"noselect searchitem\"" +
                    " title=\"" + searchDesc + "\" draggable=\"false\">" + 
                    "<img id=\"searchimg-" + searches[i].SearchNumber + "\" src=\"" + searchImg + "\" draggable=\"false\" />" +
                    "</div></li>";
        }
    }
    $("#search").html(searchHtml);
}


/*-------------------------------------------------------------------*/
/* Initialize a search drag operation.                               */
/*-------------------------------------------------------------------*/
function searchItemMouseDown(e) {
    var panelId = $("#tabpanels").find("div.tabshown").attr("id") || "null";
    if (panelId != "search") return;

    e.preventDefault();
    dragMgr.dragging = false;
    dragMgr.source = panelId;

    var selSearch = getSearch(e.target);
    if (selSearch) {
        mouseDown = true;
        dragMgr.dragData = selSearch;
        var type = selSearch.SearchType;
        dragMgr.cursorImg = document.getElementById(type + "searchcursor");
        dragMgr.cursorOffset = { x: -40, y: -40 },
        dragMgr.useSnapshot = false;
        dragMgr.snapshot = null;
        selectedArea = "";
        if (type == "air") {
            if (sfxAirSearch) sfxSearch = sfxAirSearch;
        } else {
            if (sfxSeaSearch) sfxSearch = sfxSeaSearch;
        }
    }
    setTimeout(beginControlsDrag, 150);
}

/*-------------------------------------------------------------------*/
/* Draw the search cursor at the input coordinates.                  */
/*-------------------------------------------------------------------*/
function drawCursorImg(x, y) {
    dragMgr.snapshot = searchGrid.drawSearchCursor(dragMgr.snapshot, dragMgr.cursorImg, x, y);
}

/*-------------------------------------------------------------------*/
/* Return true if input search coordinates are within search range.  */
/*-------------------------------------------------------------------*/
function withinSearchRange(coords) {
    var zone = searchGrid.coordsToZone(coords),
        i;

    if (!zone) return false;
    var area = zone.substr(0, 2);
    if (dragMgr.dragData.SearchType == "air") {
        if (game.SearchRange == 0) return true; //zero = infinite range (entire map)

        for (i = 0; i < shipZones.length; i++) {
            if (searchGrid.zoneDistance(area + "E", shipZones[i]) <= (game.SearchRange + 1))
                return true;
        }
    } else {
        for (i = 0; i < shipZones.length; i++) {
            if (shipZones[i].substr(0, 2) == area)
                return true;
        }
    }
    return false;
}
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/

function showSearching(canvasCoords) {
    cvs.style.cursor = "none";
    var coords = addVectors(canvasCoords, dragMgr.cursorOffset);
    drawCursorImg(coords.x, coords.y);

    if (withinSearchRange(canvasCoords)) {
        selectArea(canvasCoords);
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function scrollClouds() {
    var cloudsTopLeft = { x: 0, y: 0 },
        distVector = { x: side == "USN" ? 3 : -3, y: 0 },
        lastTime = new Date().getTime(),
        elapsed;

    searchGrid.drawMap(function () {
        drawSightings();
        drawShips();
        searchGrid.drawSelector(addVectors(searchGrid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 }), 1);
        mapImg = searchGrid.grabImageData();
        cloudsAnim();
    });

    function cloudsAnim() {
        cloudsAnimHandle = window.requestAnimationFrame(cloudsAnim);
        elapsed = new Date().getTime() - lastTime;

        if (elapsed >= 34) {
            searchGrid.restoreImageData(mapImg, 0, 0);
            cloudsTopLeft = addVectors(cloudsTopLeft, distVector);
            searchGrid.drawSearchClouds(cloudsTopLeft);
            lastTime = new Date().getTime();
        }
    }
}
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function hideSearching() {
    cvs.style.cursor = "auto";
    dragMgr.dragging = false;
    dragMgr.source = "";
    if (dragMgr.snapshot) {
        searchGrid.restoreImageData(dragMgr.snapshot, 0, 0);
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function executeSearch(coords, zone, search, callback) {
    if (withinSearchRange(coords)) {
        var area = zone.substr(0, 2);
       
        if (!alreadySearched(area)) {
            search.Area = area;
            ajaxPostSearch(search, function () {
                $("#search-" + search.SearchNumber).remove().parent();
                if (search.Markers && search.Markers.length) {
                    var msg = "<p style=\"font-weight: bold;\">Enemy ships sighted!<p>";
                    for (var i = 0; i < search.Markers.length; i++) {
                        msg += "<p>" + search.Markers[i].Zone + " contains one or more of each of thse types:<br />" +
                            expandTypesFound(search.Markers[i].TypesFound) + "</p>";
                    }
                    showAlert("Search " + area, msg, DLG_OK, "blue", callback);

                } else {
                    showAlert("Search " + area, "No sightings.", DLG_OK, "blue", callback);
                }
            });
        } else {
            showAlert("Search " + area, "You've already searched area " + area + " on this turn!", DLG_OK, "blue", callback);
        }
    } else {
        hideSearching();
        if (callback) callback();
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function expandTypesFound(typesFound) {
    var types = typesFound.split(","),
        expandedType, 
        expanded = "";
    
    for (var i = 0; i < types.length; i++) {
        switch (types[i]) {
            case "BB":
                expandedType = "battleship";
                break;
            case "CV":
                expandedType = "aircraft carrier";
                break;
            case "CVL":
                expandedType = "light aircraft carrier";
                break;
            case "CA":
                expandedType = "cruiser";
                break;
            case "CL":
                expandedType = "light cruiser";
                break;
            default:
                expandedType = "";
                break;
        }
        expanded += expandedType + ", ";
    }
    return expanded.substr(0, expanded.length - 2);
}

/*-------------------------------------------------------------------*/
/* Make ajax call to post new search to the server and find out if   */
/* it was successful.                                                */
/*-------------------------------------------------------------------*/
function ajaxPostSearch(search, successCallback) {
    $.ajax({
        url: "/api/search",
        type: "POST",
        contentType: "application/json",
        accepts: "application/json",
        data: JSON.stringify(search),
        success: function (data) {
            var retSearch = JSON.parse(data);
            createUpdateAuthCookie();
            if (retSearch.Markers) {
                for (var i = 0; i < retSearch.Markers.length; i++) {
                    search.Markers.push({
                        Zone: retSearch.Markers[i].Zone,
                        TypesFound: retSearch.Markers[i].TypesFound
                    });
                }
            }
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}

/*-------------------------------------------------------------------*/
/* Return the searches[] array element that corresponds to the input */
/* Search tab list item.                                             */
/*-------------------------------------------------------------------*/
function getSearch(searchItem) {
    if (!searchItem) return null;
    var searchNum = Number(searchItem.id.substr(searchItem.id.indexOf("-") + 1));
    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && searches[i].SearchNumber == searchNum)
            return searches[i];
    }
    return null;
}

/*-------------------------------------------------------------------*/
/* Determine if a search zone selected by the player has already     */
/* searched this turn.                                               */
/*-------------------------------------------------------------------*/
function alreadySearched(area) {
    for (var i = 0; i < searches.length; i++) {
        if (searches[i].Turn == game.Turn && searches[i].Area == area)
            return true;
    }
    return false;
}

