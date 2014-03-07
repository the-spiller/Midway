/*-------------------------------------------*/
// Page data object
var pageData;

// Dirty flag
var dirty = false;

// Selected zone indicator's img id
var selectorId = "#selector";

$(document).ready(function () {
    //Caesar-encoded in the "JsonData" hidden input -- make it a javascript object
    var decoded = Caesar.decode($("#JsonData").val());
    pageData = JSON.parse(decoded);

    // JQuery UI accordion
    var icons = {
        header: "ui-icon-circle-arrow-e",
        activeHeader: "ui-icon-circle-arrow-s"
    };
    $("#accordion").accordion({
        active: 0,
        heightStyle: "content",
        icons: icons,
        collapsible: true,
        beforeActivate: function (e, ui) {
            var headText = $(ui.newHeader).text();
            controlBox.setHeader(headText);

            switch (headText) {
                case controlBox.headerArrivals:
                    showControlListShips(null);
                    break;
                case controlBox.headerSelected:
                    showControlListShips(pageData.SelectedLocation);
                    break;
                default: 
                    break;
            }
        }
    });
    controlBox.setHeader($("#accordion h2").eq(0).text());

    // JQuery UI selectable
    // "tolerance fit" seems to disable lasso
    $(".selectable").selectable({ filter: "li", tolerance: "fit" });

    // Tooltips (in elements' title attribute).
    $(document).tooltip({
        content: function () {
            return $(this).attr("title");
        }
    });

    // Wire-ups for the search grid stage
    $("#stage").on({
        click: function (e) {
            var thisX = e.pageX - this.offsetLeft;
            var thisY = e.pageY - this.offsetTop;

            if (pageData.PhaseId == 2 && searching != "") {
                executeSearch({ x: thisX, y: thisY });
            } else {
                doSquareSelection({ x: thisX, y: thisY }, null);
            }
        },
        dblclick: function (e) {
            var thisX = e.pageX - this.offsetLeft;
            var thisY = e.pageY - this.offsetTop;
            stageDblClick({ x: thisX, y: thisY });
        },
        keyup: function (e) {
            confirmDelSearchMarker(e);
        }
    });
 
    // Deselect all "Forces in selected zone" ships if user clicks
    // on accordiion panel but not on any ship.
    $("#see-content").click(function () {
        $("#see li").removeClass("ui-selected");
    });

    // Undo button
    $("#undo").click(function () {
        if (pageData.PhaseId == 1) {
            doMoveUndo();
        }
        // Disable the Undo button.
        $("#undo").attr("disabled", "disabled");
    });

    // Done button
    $("#done").click(function () {
        // Full page post. Stringify pageData objects into hidden field.
        $("#SelectedLocation").val(pageData.SelectedLocation);
        $("#Points").val(pageData.Points);
        var json = JSON.stringify(pageData.Locations);
        $("#JsonData").val(json);

        $("#pagepost").submit();
    });

    // Home button
    $("#midwayhome").click(function () {
        //TODO: if the user's done stuff they'll lose, warn them.
        document.location.replace("/Game/Home");
    });

    $("#help").click(function () {
        //TODO
        showInfoDialog("NOT IMPLEMENTED.<br />YET.");
    });

    // Place ships and search markers
    setMarkers();

    // Select the map square.
    var loc = pageData.SelectedLocation;
    if (loc == null) {
        loc = "E4A";
    }
    doSquareSelection(null, loc);
}); // End of $(document).ready function

/*-----------------------------------------*/
/*Function to confirm deletion of a search */
/* marker. Callback is below.              */
/*-----------------------------------------*/
function confirmDelSearchMarker(e) {
    if (e.keyCode == 46 && pageData.WaitingFlag != 'Y') {  //Del
        var zoneObj = getZone(pageData.SelectedLocation, false);
        if (zoneObj.SearchMarker != null && zoneObj.PlacedDTime != pageData.GameDTime) {
            showConfirmDialog('Are you <span style="font-style: italic;">sure</span> you want to delete this marker?', delSearchMarker);
        }
    }
}

/*---------------------------------------------------*/
/* Callback function for confirmation of delete of a */
/* search marker.                                    */
/*---------------------------------------------------*/
function delSearchMarker(doIt) {
    if (doIt) {
        //Dump the image.
        $("#m" + pageData.SelectedLocation).remove();

        //Mark it deleted.
        getZone(pageData.SelectedLocation, false).SearchMarker.Deleted = "Y";
        
        //Empty out "Forces in selected zone."
        showControlListShips(pageData.SelectedLocation);
    }
}

/*---------------------------------------------------*/
/* Mark the square chosen by the user. Input can be  */
/* either a point on the stage or a location string. */
/* See if the selection is part of a move, and/or if */
/* the square contains ships or search markers.      */
/*---------------------------------------------------*/
function doSquareSelection(point, loc) {
    var showMove = true;

    if (point == null) {
        point = gridCalc.topLeftFromZone(loc);
    } else {
        loc = gridCalc.zoneFromPoint(point);
        point = gridCalc.topLeftFromPoint(point);
    }

    if (pageData.PhaseId == 1 && $(".selectable .ui-selected").length > 0) {
        showMove = doMovement(loc);
    }

    // Show ships in the selected zone, if any.
    if (showMove) {
        showControlListShips(loc);

        // Show the selector at the new location
        $(selectorId).css({ left: point.x - 2, top: point.y - 3 });

        // Last thing -- set new location into page data object.
        pageData.SelectedLocation = loc;
    }
}

/*----------------------------------------------*/
/* Display ships in the accordion control list: */
/* new arrivals if zone argument is null, or in */
/* the given zone if zone argument is not null. */
/* If zone contains a search marker, show the   */
/* enemy ships that were sighted.               */
/*----------------------------------------------*/
function showControlListShips(zone) {
    if (zone == null && controlBox.headerIs(controlBox.headerArrivals)) {
        // Show arriving ships.
        controlBox.loadShipListHtml(null);
    } else if (controlBox.headerIs(controlBox.headerSelected)) {
        // Show ships/airbase in selected zone.
        $("#see p").remove();

        var zoneStr;
        if (zone == "H5G") {
            zoneStr = " Midway";
        } else {
            zoneStr = " Zone " + zone;
        }
        $("#see-content").text(zoneStr);

        var listCleared = false;
        var locObj = getZone(zone, false);
        if (locObj != null) {
            if (shipsInZone(locObj, true) || locObj.Airbase != null) {
                controlBox.loadShipListHtml(zone);
                listCleared = true;
            }

            //Show ships found in search.
            if (locObj.SearchMarker != null && locObj.SearchMarker.Deleted == "N") {
                if (!listCleared) {
                    $("#see").remove();
                }
                $("#see-content").append(controlBox.searchMarkerHtml(locObj.SearchMarker));
            }
        }
    }
}

/*----------------------------------------------*/
/* If user double-clicks on their own ships,    */
/* select all ships in the Selected Ships list. */
/*----------------------------------------------*/
function stageDblClick(point) {
    var zone = gridCalc.zoneFromPoint(point);
    var zoneObj = getZone(zone, false);
    if (shipsInZone(zoneObj, true)) {
        if (!controlBox.headerIs(controlBox.headerSelected)) {
            controlBox.activateHeader(controlBox.headerSelected);
        }
        $("#see li").addClass("ui-selected");
    } else if (shipsInZone(zoneObj, false)) {
        if (!controlBox.headerIs(controlBox.headerSelected)) {
            controlBox.activateHeader(controlBox.headerSelected);
        }
    }
}

/*------------------------------------------------*/
/* Sort function for an array of objects by their */
/*'Id' attrib.                                    */
/*------------------------------------------------*/
function sortByIdAsc(obj1, obj2) {
    return obj1.Id - obj2.Id;
}

/*-----------------------------------------*/
/* Display owning player's ships marker on */
/* the input location.                     */
/*-----------------------------------------*/
function placeShipsMarker(zone) {
    if (document.getElementById("s" + zone) == null) {
        var imgId = getShipsMarkerImgId("ships");
        var point = gridCalc.topLeftFromZone(zone);
        
        $("#" + imgId).clone(false)
            .attr("id", "s" + zone)
            .addClass("shipsmarker")
            .css({ top: point.y + "px", left: (point.x - gridCalc.squareSize) + "px" })
            .appendTo("#stage");
    }
}

/*------------------------------------------*/
/* Display owning player's search marker on */
/* the input location and set its tooltip.  */
/*------------------------------------------*/
function placeSearchMarker(zone, tooltip) {
    var imgId = getShipsMarkerImgId("search");
    var point = gridCalc.topLeftFromZone(zone);
    
    $("#" + imgId).clone(false)
        .attr({ title: tooltip, id: "m" + zone })
        .addClass("searchmarker")        
        .css({ top: point.y + "px", left: point.x + "px" })
        .appendTo("#stage");
}

/*------------------------------------------*/
/* Find and return the ship or search       */
/* marker markup id based on input type and */
/* player's side (US or Japanese).          */
/*------------------------------------------*/
function getShipsMarkerImgId(type) {
    var imgId = "usnships";

    if (type == "ships") {
        if (pageData.PlayerSide == "IJN") {
            imgId = "ijnships";
        }
    } else if (type == "search") {
        if (pageData.PlayerSide == "USN") {
            imgId = "ijnsighting";
        } else {
            imgId = "usnsighting";
        }
    }
    return imgId;
}

/*---------------------------------------------*/
/* Find and return a location in the page data */
/* location objects array. If not found and    */
/* the input create argument is true, add a    */
/* new location and and return that.           */
/*---------------------------------------------*/
function getZone(zone, create) {
    var ret = null;

    for (var i = 0; i < pageData.Locations.length; i++) {
        if (pageData.Locations[i].Zone == zone) {
            ret = pageData.Locations[i];
            break;
        }
    }
    if (ret == null && create) {
        // Create new location and add it.
        var newLocObj = { Zone: zone, SearchMarker: null, Ships: [], Airbase: null };
        pageData.Locations.push(newLocObj);
        ret = getZone(zone, false);
    }
    if (ret != null && ret.Ships == null) {
        ret.Ships = [];
    }
    return ret;
}

/*-------------------------------------------*/
/* Locate and return the Ship object         */        
/* that corresponds to the input ship Id.    */
/* Search all ships lists in the data before */
/* throwing in the towel and returning null. */
/*-------------------------------------------*/
function getShip(shipId) {
    var ship = null;
    var list;

    // Search locations for this ship.
    $(pageData.Locations).each(function () {
        if (this.Ships != null) {
            $(this.Ships).each(function () {
                if (this.Id == shipId) {
                    ship = this;
                    return false;   // Breaks out of the inner JQuery.each() loop.
                }
                return true;
            });
        }
        return ship != null ? false : true;  // Breaks out of the outer JQuery.each() loop when false.
    });
    
    if (ship != null) {
        return ship;
    } else {
        // Search arrivals, ships due and ships off-map for this ship.
        for (var i = 0; i < 3; i++) {
            switch (i) {
                case 0:
                    list = pageData.ArrivingShips;
                    break;
                case 1:
                    list = pageData.ShipsDue;
                    break;
                default:
                    list = pageData.offMapShips;
                    break;
            }
            if (list != null) {
                $(list).each(function () {
                    if (this.Id == shipId) {
                        ship = this;
                        return false;   // Breaks out of the JQuery.each() loop.
                    }
                    return true;
                });
            }
            if (ship != null) {
                break;
            }
        }
    }
    return ship;
}

/*------------------------------------------*/
/* Locate and return the airbase object     */
/* that corresponds to the input airbase Id.*/
/* Return null if it isn't found.           */
/*------------------------------------------*/
function getAirbase(airbaseId) {
    var airbase = null;

    for (var i = 0; i < pageData.Locations.length; i++) {
        if (pageData.Locations[i].Airbase != null) {
            if (pageData.Locations[i].Airbase.Id == airbaseId) {
                airbase = pageData.Locations[i].Airbase;
                break;
            }
        }
    }
    return airbase;
}

/*-------------------------------------------------*/
/* Test for a ship at the input location. Return   */
/* true if it belongs to our side and input 'ours' */
/* is true, or if it belongs to the other side and */
/* input 'ours' is false. Return false if neither  */
/* condition is met or no ship is found.          */
/*-------------------------------------------------*/
function shipsInZone(locationObject, ourShips) {
    var ret = false;

    if (locationObject != null && locationObject.Ships != null) {
        for (var i = 0; i < locationObject.Ships.length; i++) {
            if (ourShips && locationObject.Ships[i].OwningSide == pageData.PlayerSide) {
                ret = true;
                break;
            } else if (!ourShips && locationObject.Ships[i].OwningSide != pageData.PlayerSide) {
                ret = true;
                break;
            }
        }
    }
    return ret;
}

/*-----------------------------------*/
/* Place ship and search markers on  */
/* the map (once, on page load).     */
/*-----------------------------------*/
function setMarkers() {
    var locObj;

    for (var i = 0; i < pageData.Locations.length; i++) {
        // Ship markers
        locObj = pageData.Locations[i];

        if (locObj.Zone != "OFF" && locObj.Zone != "SNK") {
            if (shipsInZone(locObj, true)) {
                placeShipsMarker(locObj.Zone);
            }
        }
        // Search markers
        if (locObj.SearchMarker != null && locObj.SearchMarker.DeletedFlag != "Y") {
            placeSearchMarker(locObj.Zone, controlBox.markerTooltip(locObj.SearchMarker));
        }
    }
}

/*-----------------------------------------*/
/* Grid locations calculation to and from  */
/* zone strings and pixel coordinates.     */
/*-----------------------------------------*/
var gridCalc = {
    // Top left of map grid within stage div.
    _baseX: 20,
    _baseY: 24,

    // Size in pixels of one zone square.
    squareSize: 35,

    // Range of attacking aircraft in zones.
    attackRange: 14,

    /*------------------------------------------*/
    /* Turn click coordinates into the top left */
    /* coordinates for the square selected.     */
    /*------------------------------------------*/
    topLeftFromPoint: function(point) {
        var top = point.y;
        var left = point.x;
        var squareCount;

        if (top < (this._baseY + this.squareSize)) {
            top = this._baseY;
        } else {
            squareCount = Math.floor((top - this._baseY) / this.squareSize);
            top = (squareCount * this.squareSize) + this._baseY;
        }
        if (left < (this._baseX + this.squareSize)) {
            left = this._baseX;
        } else {
            squareCount = Math.floor((left - this._baseX) / this.squareSize);
            left = (squareCount * this.squareSize) + this._baseX;
        }
        return { x: left, y: top };
    },

    /*-----------------------------------------*/
    /* Turn click coordinates into the string  */
    /* location value (aka "zone") for the     */
    /* square clicked on.                      */
    /*-----------------------------------------*/
    zoneFromPoint: function(point) {
        var loc = "";
        var x = point.x - this._baseX;
        var y = point.y - this._baseY;
        var zoneRow = 0;
        var zoneCol = 0;

        if (x < 0) {
            loc = "A";
            zoneCol = 1;
        } else {
            var squareCount = x / this.squareSize;
            if (squareCount <= 3) {
                loc = "A";
                zoneCol = squareCount;
            } else if (squareCount <= 6) {
                loc = "B";
                zoneCol = squareCount - 3;
            } else if (squareCount <= 9) {
                loc = "C";
                zoneCol = squareCount - 6;
            } else if (squareCount <= 12) {
                loc = "D";
                zoneCol = squareCount - 9;
            } else if (squareCount <= 15) {
                loc = "E";
                zoneCol = squareCount - 12;
            } else if (squareCount <= 18) {
                loc = "F";
                zoneCol = squareCount - 15;
            } else if (squareCount <= 21) {
                loc = "G";
                zoneCol = squareCount - 18;
            } else if (squareCount <= 24) {
                loc = "H";
                zoneCol = squareCount - 21;
            } else {
                loc = "I";
                zoneCol = squareCount - 24;
            }
            zoneCol = Math.floor(zoneCol) + 1;
        }

        if (y < 0) {
            loc += "1";
            zoneRow = 1;
        } else {
            squareCount = y / this.squareSize;
            if (squareCount <= 3) {
                loc += "1";
                zoneRow = squareCount;
            } else if (squareCount <= 6) {
                loc += "2";
                zoneRow = squareCount - 3;
            } else if (squareCount <= 9) {
                loc += "3";
                zoneRow = squareCount - 6;
            } else if (squareCount <= 12) {
                loc += "4";
                zoneRow = squareCount - 9;
            } else if (squareCount <= 15) {
                loc += "5";
                zoneRow = squareCount - 12;
            } else if (squareCount <= 18) {
                loc += "6";
                zoneRow = squareCount - 15;
            } else {
                loc += "7";
                zoneRow = squareCount - 18;
            }
            zoneRow = Math.floor(zoneRow) + 1;
        }

        switch (zoneCol * 10 + zoneRow) {
        case 11:
            loc += "A";
            break;
        case 12:
            loc += "D";
            break;
        case 13:
            loc += "G";
            break;
        case 21:
            loc += "B";
            break;
        case 22:
            loc += "E";
            break;
        case 23:
            loc += "H";
            break;
        case 31:
            loc += "C";
            break;
        case 32:
            loc += "F";
            break;
        default:
            loc += "I";
        }
        return loc;
    },

    /*----------------------------------------*/
    /* Turn a string location on the grid     */
    /* (aka "zone") into that square's top    */
    /* and left cooordinates.                 */
    /*----------------------------------------*/
    topLeftFromZone: function(loc) {
        var left = this._baseX;
        var top = this._baseY;

        switch (loc.substr(0, 1)) {
        case "B":
            left += (this.squareSize * 3);
            break;
        case "C":
            left += (this.squareSize * 6);
            break;
        case "D":
            left += (this.squareSize * 9);
            break;
        case "E":
            left += (this.squareSize * 12);
            break;
        case "F":
            left += (this.squareSize * 15);
            break;
        case "G":
            left += (this.squareSize * 18);
            break;
        case "H":
            left += (this.squareSize * 21);
            break;
        case "I":
            left += (this.squareSize * 24);
            break;
        default:
            break;
        }
        var row = Number(loc.substr(1, 1)) - 1;
        top += row * (this.squareSize * 3);

        switch (loc.substr(2)) {
        case "B":
            left += this.squareSize;
            break;
        case "C":
            left += (this.squareSize * 2);
            break;
        case "D":
            top += this.squareSize;
            break;
        case "E":
            top += this.squareSize;
            left += this.squareSize;
            break;
        case "F":
            top += this.squareSize;
            left += (this.squareSize * 2);
            break;
        case "G":
            top += (this.squareSize * 2);
            break;
        case "H":
            top += (this.squareSize * 2);
            left += this.squareSize;
            break;
        case "I":
            top += (this.squareSize * 2);
            left += (this.squareSize * 2);
            break;
        default:
            break;
        }
        return { x: left, y: top };
    },

    /*---------------------------------------=-------------*/
    /* Calculate the distance in zones ("squares") between */
    /* two zones.                                          */
    /*----------------------------------------=------------*/
    zonesApart: function(oneZone, anotherZone) {
        var onePoint = this.topLeftFromZone(oneZone);
        var anotherPoint = this.topLeftFromZone(anotherZone);

        var biggest;
        var xDiff = Math.abs(onePoint.x - anotherPoint.x);
        var yDiff = Math.abs(onePoint.y - anotherPoint.y);
        if (xDiff < yDiff) {
            biggest = yDiff;
        } else {
            biggest = xDiff;
        }
        return biggest / this.squareSize;
    },

    /*-------------------------------------------------*/
    /* Return point at top left of the area containing */
    /* the input zone.                                 */
    /*-------------------------------------------------*/
    areaTopLeftFromZone: function(zone) {
        return this.topLeftFromZone(zone.substring(0, 2) + "A");
    },

    /*------------------------------------------*/
    /* Validation for bringing arrivals onto    */
    /* the map: see that the square chosen by   */
    /* the user is on the appropriate map edge. */
    /*------------------------------------------*/
    edgeZoneSelected: function(zone) {
        var ret = false;
        var col = "I";
        var zones = "BEH";

        if (pageData.PlayerSide == "IJN") {
            col = "A";
            zones = "ADG";
        }

        if (zone.substring(0, 1) == col && zones.indexOf(zone.substring(2)) > -1) {
            ret = true;
        }
        return ret;
    }
};   // End of gridCalc object

/*---------------------------------------------------*/
/* Class to support use of jquery accordion "control */
/* box." Headers indicate which panel is current,    */
/* and html routines provide panel content.          */
/*---------------------------------------------------*/
var controlBox = {
    _header: "",

    setHeader: function(value) {
        this._header = value;
    },
    //getHeader: function () {
    //    return _header;
    //},

    headerArrivals: "Arriving ships",
    headerSelected: "Forces in selected zone",
    headerReady: "Aircraft readiness",
    headerOffMap: "Ships that are off-map",
    headerSearch: "Search for enemy ships",
    headerOppSearches: "Opponent's searches",
    headerAirOps: "Plan air operations",

    headerIs: function(head) {
        return (this._header == head);
    },

    activateHeader: function(value) {
        // Loop thru Actions and find the match
        for (var i = 0; i < pageData.Actions.length; i++) {
            if (value == pageData.Actions[i].Description) {
                $("#accordion").accordion("option", "active", i);
                this.setHeader(value);
                return;
            }
        }
    },
    
    /*------------------------------------------*/
    /* Get HTML for display of ship silhouettes */
    /* in the control "Selected" list based on  */
    /* the input search marker.                 */
    /*------------------------------------------*/
    searchMarkerHtml: function(searchMarker) {
        // Show search marker contents.
        var imgSide = "usn";
        if (pageData.PlayerSide == "USN") {
            imgSide = "ijn";
        }
        var html = '<p>';
        var img = '<div class="foundship"><img src="/Content/Images/Ships/' + imgSide + '{0}.png" /></div>';
        var i;

        for (i = 0; i < searchMarker.CVs; i++) {
            html += img.replace("{0}", "cv");

        }
        for (i = 0; i < searchMarker.CVLs; i++) {
            html += img.replace("{0}", "cvl");
        }
        for (i = 0; i < searchMarker.BBs; i++) {
            html += img.replace("{0}", "bb");
        }
        for (i = 0; i < searchMarker.CAs; i++) {
            html += img.replace("{0}", "ca");
        }
        for (i = 0; i < searchMarker.CLs; i++) {
            html += img.replace("{0}", "cl");
        }

        return html + "</p><p>Sighted " + searchMarker.PlacedDTime.replace(" 1942", "") + "</p>";
    },

    /*------------------------------------------------------*/
    /* Load list for display of ships at the input location */
    /* in the Selected  Ships list.  If the location is     */
    /*  null, display ships  in the Arriving Ships list.    */
    /*------------------------------------------------------*/
    loadShipListHtml: function(zone) {
        var ship;
        var container;
        var list;
        var id;
        var locObj;
        var shipList;

        if (zone == null) {
            container = "#reinforce-content";
            list = "#reinforce";
            id = "reinforce";
            shipList = pageData.ArrivingShips;
        } else {
            container = "#see-content";
            list = "#see";
            id = "see";
            locObj = getZone(zone, false);
            shipList = locObj.Ships;
        }

        $(list).remove();

        if (shipList != null && shipList.length > 0) {
            $(container).append('<ul id="' + id + '" class="selectable"></ul>');
            for (var i = 0; i < shipList.length; i++) {
                // Add list items
                ship = shipList[i];
                $(list).append(this.shipHtml(ship));
            }
        }

        // Make it a JQuery selectable again.
        $(".selectable").selectable({ filter: "li" });

        // Append Midway to the bottom.
        if (locObj != null && locObj.Airbase != null) {
            if (locObj.Airbase.OwningSide == pageData.PlayerSide) {
                // Not selectable
                $(container).append(this.airbaseHtml(locObj.Airbase));
            }
        }
    },

    /*-----------------------------------------*/
    /* Build up and return the html to display */
    /* one ship in the control box Arrivals or */
    /* Selected Square lists.                  */
    /*-----------------------------------------*/
    shipHtml: function(ship) {
        var planes = "";
        var hits = "";

        if (ship.ShipType == "CV" || ship.ShipType == "CVL") {
            planes = '<div class="numplanes torpedo">' + ship.TSquadrons +
                '</div><div class="numplanes fighter">' + ship.FSquadrons +
                '</div><div class="numplanes divebomber">' + ship.DSquadrons + '</div>';
        }

        if (ship.Hits > 0) {
            hits = '<img src="/Content/images/Ships/Hits/' + ship.Hits + '-hitsred.png" class="shiphits red" />';
        }

        return '<li class="ui-selectee" id="' + ship.Id + '" title="' + this.shipTooltip(ship) +
            '" style="background-image: url(' + ship.SearchImgPath + '.png);">' +
            '<div>' + planes + '<img src="/Content/Images/Ships/Hits/' + ship.HitsToSink +
            '-hitsgreen.png" class="shiphits green" />' + hits + '</div></li>';
    },

    /*------------------------------------------------*/
    /* Build up and return the html to display an     */
    /* airbase in the control box Selected Ships list.*/
    /*------------------------------------------------*/
    airbaseHtml: function(airbase) {
        var readyState = airbase.AirReadyState;
        var title = airbase.Name + "<br />Fortification strength: " + airbase.FortificationStrength +
            "<br />Aircraft capacity: " + airbase.AircraftCapacity +
            "<br />Aircraft " + (readyState == 0 ? "not ready" : (readyState == 1 ? "readying" : "ready"));
        var planes = '<div class="numplanes torpedo">' + airbase.TSquadrons +
            '</div><div class="numplanes fighter">' + airbase.FSquadrons +
            '</div><div class="numplanes divebomber">' + airbase.DSquadrons + '</div>';

        return '<div class="airbase" id="airbase' + airbase.Id + '" title="' + title +
            '" style="background-image: url(' + airbase.SearchImgPath + '.png);">' +
            '<div>' + planes + '</div></div>';
    },

    /*--------------------------------------------*/
    /* Build up and return the tooltip html for   */
    /* the input ship object.                     */
    /*--------------------------------------------*/
    shipTooltip: function(shipObj) {
        var ret;
        var movement = "";
        if (pageData.PhaseId == 1) {
            movement = "<br />Available movement: " + shipObj.MovePoints + " zones";
        }
        var readyState = shipObj.AirReadyState;
        var ready = "";
        switch (shipObj.ShipType) {
        case "CV":
            ret = "Aircraft carrier ";
            ready = "<br />Aircraft " + (readyState == 0 ? "not ready" : (readyState == 1 ? "readying" : "ready")) +
                "<br />Aircraft capacity: " + shipObj.AircraftCapacity;
            break;
        case "CVL":
            ret = "Light aircraft carrier ";
            ready = "<br />Aircraft " + (readyState == 0 ? "not ready" : (readyState == 1 ? "readying" : "ready")) +
                "<br />Aircraft capacity: " + shipObj.AircraftCapacity;
            break;
        case "CA":
            ret = "Cruiser ";
            break;
        case "CL":
        case "CLAA":
            ret = "Light cruiser ";
            break;
        default:
            ret = "Battleship ";
            break;
        }
        ret += shipObj.Name + movement + "<br />Hits: "
            + shipObj.Hits + " (" + shipObj.HitsToSink + " to sink)" + ready;

        return ret;
    },

    /*--------------------------------------------*/
    /* Build up and return the tooltip html for   */
    /* the input search marker object.            */
    /*--------------------------------------------*/
    markerTooltip: function(marker) {
        var ret;

        if (marker.PlacedDTime == pageData.GameDTime) {
            ret = "Sighted this turn.";
        } else {
            ret = "Sighted " + marker.PlacedDTime.replace(" 1942", "");
        }

        if (marker.CVs > 0) {
            ret += "<br />" + marker.CVs + " aircraft carriers";
        }
        if (marker.CVLs > 0) {
            ret += "<br />" + marker.CVLs + " light aircraft carriers";
        }
        if (marker.BBs > 0) {
            ret += "<br />" + marker.BBs + " battleships";
        }
        if (marker.CAs > 0) {
            ret += "<br />" + marker.CAs + " cruisers";
        }
        if (marker.CLs > 0) {
            ret += "<br />" + marker.CLs + " light cruisers";
        }
        if (marker.DDs > 0) {
            ret += "<br />" + marker.DDs + " destroyers";
        }
        return ret;
    }
};   // End of controlBox object
