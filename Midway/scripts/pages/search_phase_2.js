// Events and functions for Phase 2 (Search)
var currentSearch = null,
    sfxSearch,
    searchCursorVisible = false;

$(document).on("click", ".searchitem", function () {
    var hasClass = $(this).hasClass("selected");
    hideSearching();
    
    if (!hasClass) {
        $(this).addClass("selected");
        initSearch(this);
    }
});

$("#canvii").on("mousemove", function(e) {
    if (game.PhaseId != 2 || !currentSearch) return;
    var coords = windowToCanvas(cvs, e.clientX, e.clientY);
    if (withinSearchRange(coords)) {
        if (!searchCursorVisible) {
            $("#searchcursor").css("display", "block");
            searchCursorVisible = true;
        }
        var left = coords.x + window.mapLeft - 43,
            top = coords.y + 17;
        $("#searchcursor").css({ left: left + "px", top: top + "px" });
        
        selectArea(coords);
    } else {
        $("#searchcursor").css("display", "none");
        searchCursorVisible = false;
        deselectArea();
    }
});
/*---------------------------------------------------------------------------*/
/* Load the Search tab with its control elements.                            */
/*---------------------------------------------------------------------------*/
function loadSearchPhase() {
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
                    searchDesc = "Select to search any area containing one of your ships";
                    searchImg = imgDir + side.toLowerCase() + "-sea-search.png";
                } else if (game.SearchRange == 0) { //Unlimited
                    searchDesc = "Select to search any area";
                } else {
                    searchDesc = "Select to search any area within " + game.SearchRange + " zones of any of your ships";
                }
                tabHtml += "<li><div id=\"search-" + searches[i].SearchNumber + "\" class=\"searchitem\"" +
                    " title=\"" + searchDesc + "\" draggable=\"false\">" +
                    "<img id=\"searchimg-" + searches[i].SearchNumber + "\" src=\"" + searchImg + "\" draggable=\"false\" />" +
                    "</div></li>";
            }
        }
    }
    $("#search").html(tabHtml);
}
/*---------------------------------------------------------------------------*/
/* Execute scrolling clouds effect over map (called from search.js).         */
/*---------------------------------------------------------------------------*/
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
                }
            }
        }
    }
}
/*---------------------------------------------------------------------------*/
/* Find and return the search item having the input search number value.     */
/*---------------------------------------------------------------------------*/
function getSearchByNumber(searchNumber) {
    for (var i = 0; i < searches.length; i++) {
        if (searches[i].SearchNumber == searchNumber) {
            return searches[i];
        }
    }
    return null;
}
/*---------------------------------------------------------------------------*/
/* Initialize search in response to selection of a search item.              */
/*---------------------------------------------------------------------------*/
function initSearch(searchItem) {
    var searchNum = searchItem.id.substr(searchItem.id.indexOf("-") + 1);
    currentSearch = getSearchByNumber(searchNum);

    if (currentSearch.SearchType == "air")
        sfxSearch = window.sfxAirSearch;
    else
        sfxSearch = window.sfxSailing;

    if (sfxSearch) sfxSearch.play().fade(0, window.audioVol * 0.01, 500);

    var cursorPath = "/content/images/search/" + side.toLowerCase() + "-" + currentSearch.SearchType + "searchcursor.png";
    $("#searchcursor").css("background", "url(" + cursorPath + ") no-repeat left top");
}
/*---------------------------------------------------------------------------*/
/* Called from search.js canvii click event handler. If searching,   */
/* execute search and return true.                                   */
/*---------------------------------------------------------------------------*/
function checkSearching(clickEvent) {
    if (currentSearch) {
        executeSearch(windowToCanvas(cvs, clickEvent.clientX, clickEvent.clientY), function () {
            var search = getSearchByNumber(currentSearch.SearchNumber);
            hideSearching();
            
            // show the enemy fleet(s) we found, if any
            for (var i = 0; i < search.Markers.length; i++) {
                searchGrid.drawSightingMarker(search.Markers[i].Zone, 0);
            }
        });
        return true;
    } else {
        return false;
    }
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function executeSearch(coords, callback) {
    if (withinSearchRange(coords)) {
        selectArea(coords);
        if (!alreadySearched(selectedArea)) {
            currentSearch.Area = selectedArea;
            ajaxPostSearch(currentSearch, function () {
            $("#search-" + currentSearch.SearchNumber).remove().parent();
                if (currentSearch.Markers && currentSearch.Markers.length) {
                    var msg = "<p style=\"font-weight: bold;\">Enemy ships sighted!<p>";
                    for (var i = 0; i < currentSearch.Markers.length; i++) {
                        msg += "<p>" + currentSearch.Markers[i].Zone + " contains one or more of each of thse types:<br />" +
                            expandTypesFound(currentSearch.Markers[i].TypesFound) + "</p>";
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
/*---------------------------------------------------------------------------*/
/* Return true if input search coordinates are within search range.          */
/*---------------------------------------------------------------------------*/
function withinSearchRange(coords) {
    var zone = searchGrid.coordsToZone(coords),
        i;

    if (!zone) return false;
    var area = zone.substr(0, 2);
    if (currentSearch.SearchType == "air") {
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
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function hideSearching() {
    $(".searchitem").removeClass("selected");
    if (sfxSearch) sfxSearch.stop();
    deselectArea();
    $("#searchcursor").css("display", "none");
    currentSearch = null;
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
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

