
// Events and functions for Phase 2 (Search)

$(document).on("mousedown", ".searchitem", function(e) {
    searchItemMouseDown(e);
});

/*-------------------------------------------------------------------*/
/* Load the Search tab with its control elements.                    */
/*-------------------------------------------------------------------*/
function loadPhaseTab() {
    var tabHtml = "<div style=\"margin: 5px 0 15px 5px;\">";
    if (game.Waiting == "Y") {
        tabHtml += "Waiting for opponent</div>";
    } else {
        var searchDesc,
            searchImg = imgDir + side.toLowerCase() + "-air-search.png";
        
        tabHtml += "Available searches</div><ul>";

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
                tabHtml += "<li><div id=\"search-" + searches[i].SearchNumber + "\" class=\"noselect searchitem\"" +
                    " title=\"" + searchDesc + "\" draggable=\"false\">" +
                    "<img id=\"searchimg-" + searches[i].SearchNumber + "\" src=\"" + searchImg + "\" draggable=\"false\" />" +
                    "</div></li>";
            }
        }
    }
    $("#search").html(tabHtml);
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
        window.mouseDown = true;
        dragMgr.dragData = selSearch;
        dragMgr.cursorImg = document.getElementById(selSearch.SearchType + "searchcursor");
        dragMgr.cursorOffset = { x: -40, y: -40 },
        dragMgr.useSnapshot = false;
        dragMgr.snapshot = null;
        window.selectedArea = "";

        if (selSearch.SearchType == "air") {
            if (sfxAirSearch) sfxSearch = sfxAirSearch;
        } else {
            if (sfxSailing) sfxSearch = sfxSailing;
        }
    }
    setTimeout(beginControlsDrag, 150);
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
function scrollClouds() {
    var fadeAlpha = 0,
        fadeDelta = 0.05,
        cloudsTopLeft,
        velocity,
        reset,
        lastTime = new Date().getTime(),
        elapsed;

    if (side == "USN") {
        cloudsTopLeft = { x: -964, y: 0 };
        velocity = { x: 2, y: 0 };
        reset = function () {
            if (cloudsTopLeft.x > -1) cloudsTopLeft.x = -964;
        };

    } else {
        cloudsTopLeft = { x: 0, y: 0 };
        velocity = { x: -2, y: 0 };
        reset = function () {
            if (cloudsTopLeft.x < -964) cloudsTopLeft.x = 0;
        };
    }
    cloudsAnim();

    function cloudsAnim() {
        var hAnim = window.requestAnimationFrame(cloudsAnim);
        elapsed = new Date().getTime() - lastTime;

        if (elapsed >= 34) {
            cloudsTopLeft = addVectors(cloudsTopLeft, velocity);
            reset();
            
            if (game.PhaseId == 2) {
                if (fadeAlpha < 1) fadeAlpha += fadeDelta;
                searchGrid.drawSearchClouds(fadeAlpha, cloudsTopLeft);
                lastTime = new Date().getTime();
            } else if (game.PhaseId > 2) {
                if (fadeAlpha > 0) {
                    fadeAlpha -= fadeDelta;
                    searchGrid.drawSearchClouds(fadeAlpha, cloudsTopLeft);
                    lastTime = new Date().getTime();
                } else {
                    window.cancelAnimationFrame(hAnim);
                    document.getElementById("canvii").removeChild(document.getElementById("cloudscanvas"));
                    document.getElementById("canvii").removeChild(document.getElementById("searchcursorcanvas"));
                }
            }
        }
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function showSearching(canvasCoords) {
    var coords = addVectors(canvasCoords, dragMgr.cursorOffset);
    
    searchGrid.drawSearchCursor(coords.x, coords.y);

    if (withinSearchRange(canvasCoords)) {
        selectArea(canvasCoords);
    } else {
        deselectArea();
    }
}
/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function hideSearching(callback) {
    var finishThis = function () {
        if (sfxSearch) sfxSearch.stop();
        dragMgr.dragging = false;
        dragMgr.source = "";
        deselectArea();
        searchGrid.clearSearchCursor();
        if (callback) callback();
    };
    
    if (sfxSearch) {
        sfxSearch.fade(sfxSearch.volume(), 0, 500, finishThis());
    } else {
        finishThis();
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function executeSearch(coords, zone, search, callback) {
    if (withinSearchRange(coords)) {
        selectArea(coords);
        window.selectedArea = zone.substr(0, 2);
        
        if (!alreadySearched(selectedArea)) {
            search.Area = selectedArea;
            ajaxPostSearch(search, function () {
                $("#search-" + search.SearchNumber).remove().parent();
                if (search.Markers && search.Markers.length) {
                    var msg = "<p style=\"font-weight: bold;\">Enemy ships sighted!<p>";
                    for (var i = 0; i < search.Markers.length; i++) {
                        msg += "<p>" + search.Markers[i].Zone + " contains one or more of each of thse types:<br />" +
                            expandTypesFound(search.Markers[i].TypesFound) + "</p>";
                    }
                    showAlert("Search " + selectedArea, msg, DLG_OK, "blue", callback);

                } else {
                    showAlert("Search " + selectedArea, "No sightings.", DLG_OK, "blue", callback);
                }
            });
        } else {
            showAlert("Search " + selectedArea, "You've already searched area " + selectedArea + " on this turn!",
                DLG_OK, "red", callback);
        }
    } else {
        showAlert("Search", "Out of range.", DLG_OK, "red", callback);
    }
}

/*-------------------------------------------------------------------*/
/*-------------------------------------------------------------------*/
function expandTypesFound(typesFound) {
    var types = typesFound.split(","),
        expanded = "";
    
    for (var i = 0; i < types.length; i++) {
        expanded += typeName(types[i]).toLowerCase() + ", ";
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

