
// Events and functions for Phase 3 (Air Ops)

var oppSearches = [];

$(document).on("mouseenter", ".oppsearchitem", function (e) {
    showOppSearchedArea(e);
}).on("mouseleave", ".oppsearchitem", function () {
    hideOppSearchedArea();
}).on("click", "#airopadd", function () {
    addAirOperation();
});

/*-------------------------------------------------------------------*/
/* Load the Air Ops tab with its control elements.                   */
/*-------------------------------------------------------------------*/
function loadPhaseTab() {
    // Opponent's searches
    var opsHtml = "<div class=\"listheader\">Your opponent's searches</div>",
        airPath = side == "USN" ? imgDir + "ijn-air-search.png" : imgDir + "usn-air-search.png",
        seaPath = side == "USN" ? imgDir + "ijn-sea-search.png" : imgDir + "usn-sea-search.png";
    if (oppSearches.length == 0) {
        opsHtml += "<div style=\"padding: 8px;\">Your opponent did not search.</div>";
    } else {
        opsHtml += "<table style=\"width: 97%; margin: 0 5px;\">";
        for (var i = 0; i < oppSearches.length; i++) {
            var searchImgSrc = airPath;
            if (oppSearches[i].SearchType == "sea") {
                searchImgSrc = seaPath;
            }

            var zones = "No ships sighted";
            if (oppSearches[i].Markers.length) {
                zones = "<span style=\"color: #ffd651;\">Ships sighted at ";
                for (var j = 0; j < oppSearches[i].Markers.length; j++) {
                    zones += oppSearches[i].Markers[j].Zone + ", ";
                }
                zones = zones.substr(0, zones.length - 2) + "</span>";
            }
            opsHtml += "<tr id=\"" + oppSearches[i].Area + "\" class=\"oppsearchitem\"><td style=\"width: 40%;\">" +
                "<img src=\"" + searchImgSrc + "\" /></td><td>Area " + oppSearches[i].Area +
                "<br />" + zones + "</td></tr>";
        }
        opsHtml += "</table>";
    }
    
    // Air Operations
    opsHtml += "<div class=\"listheader\">Air Operations</div>";
    if (game.AircraftReadyState < 2) {
        opsHtml += "<div style=\"padding: 8px;\">None of your aircraft are ready for operations.</div>";
    } else {
        opsHtml += "<table style=\"width: 97%; margin: 0 5px;\">" +
            "<tr><th>Zone</th><th>Mission</th><th colspan=\"2\">Aircraft<th>" +
            "<tr><td id=\"lastrow\" colspan=\"4\"><img id=\"airopadd\" class=\"airopbutton\" title=\"Add an air operation\" src=\"" +
            imgDir + "addicon.png\"></td></tr></table>";
    }
    $("#airops").html(opsHtml);
}

/*-------------------------------------------------------------------*/
/* Highlight the area of an opponent's search item.                  */
/*-------------------------------------------------------------------*/
function showOppSearchedArea(e) {
    mapImg = searchGrid.grabImageData();
    var area = $(e.target).text().substr(5, 2);
    if (area)
        searchGrid.drawOppSearchArea(area);
}

/*-------------------------------------------------------------------*/
/* Remove the highlight of an opponent's search item's area.         */
/*-------------------------------------------------------------------*/
function hideOppSearchedArea() {
    if (mapImg) {
        searchGrid.restoreImageData(mapImg, 0, 0);
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
/* Show air op dialog and capture data for new aip op. Display in    */
/* table on AirOps tab.                                              */
/*-------------------------------------------------------------------*/
function addAirOperation() {
    captureAirOpInputs(function (resp) {
        hideDialog();
        if (resp == "OK") {
            
        }
    });
    
}

