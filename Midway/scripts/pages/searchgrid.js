﻿var searchGrid = (function() {
    var zonesize = 36,
        mapmargin = 27,
        mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
        cvs = document.getElementById("searchcanvas"),
        ctx = cvs.getContext("2d"),
        selRemoveImage = null,
        //functions called internally
        privZoneToTopLeftCoords = function(zone) {
            var col = 0,
                areaSize = zonesize * 3;

            for (var i = 0; i < mapCols.length; i++) {
                if (zone.charAt(0) == mapCols[i]) {
                    col = (i * areaSize) + mapmargin;
                    break;
                }
            }
            var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + mapmargin;
            switch (zone.substr(2, 1)) {
            case "B":
                col += zonesize;
                break;
            case "C":
                col += zonesize * 2;
                break;
            case "D":
                row += zonesize;
                break;
            case "E":
                row += zonesize;
                col += zonesize;
                break;
            case "F":
                row += zonesize;
                col += zonesize * 2;
                break;
            case "G":
                row += zonesize * 2;
                break;
            case "H":
                row += zonesize * 2;
                col += zonesize;
                break;
            case "I":
                row += zonesize * 2;
                col += zonesize * 2;
                break;
            }
            return { x: col, y: row };
        },
        privCoordsToZone = function(coords) {
            var x = coords.x,
                y = coords.y;

            if (x < 28 || x > 962 || y < 28 || y > 746)
                return "";

            var zoneRow = (y - mapmargin) / zonesize;
            var row = Math.floor(zoneRow / 3 + 1).toString();
            var areaRow = Math.floor(zoneRow % 3 + 1);

            var zoneCol = (x - mapmargin) / zonesize;
            var colRow = mapCols[Math.floor(zoneCol / 3)] + row;
            var areaCol = Math.floor(zoneCol % 3 + 1);

            var areaRowCol = areaRow * 10 + areaCol;
            switch (areaRowCol) {
            case 11:
                return colRow + "A";
            case 12:
                return colRow + "B";
            case 13:
                return colRow + "C";
            case 21:
                return colRow + "D";
            case 22:
                return colRow + "E";
            case 23:
                return colRow + "F";
            case 31:
                return colRow + "G";
            case 32:
                return colRow + "H";
            default:
                return colRow + "I";
            }
        },
        privCoordsToTopLeftCoords = function(coords) {
            var zonesX = coords.x - mapmargin < 0 ? 0 : Math.floor((coords.x - mapmargin) / zonesize),
                zonesY = coords.y - mapmargin < 0 ? 0 : Math.floor((coords.y - mapmargin) / zonesize);
            return { x: (zonesX * zonesize) + mapmargin, y: (zonesY * zonesize) + mapmargin };
        },
        privDrawSelBox = function(left, top, sideLength) {
            ctx.save();
            ctx.globalAlpha = 0.6;
            ctx.lineWidth = 4;
            ctx.strokeStyle = "#ffd651";
            ctx.beginPath();
            ctx.moveTo(left + 2, top + 2);
            ctx.lineTo(left + sideLength, top + 2);
            ctx.lineTo(left + sideLength, top + sideLength);
            ctx.lineTo(left + 2, top + sideLength);
            ctx.closePath();
            ctx.stroke();
            ctx.restore();
        };

    return {
        // read-only public props
        zoneSize: function () { return zonesize; },
        mapMargin: function () { return mapmargin; },
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to the name of the search map    */
        /* zone that contains them.                                          */
        /*-------------------------------------------------------------------*/
        coordsToZone: function (coords) {
            return privCoordsToZone(coords);
        },
        /*-------------------------------------------------------------------*/
        /* Convert a zone name to its top left canvas coordinates.           */
        /*-------------------------------------------------------------------*/
        zoneToTopLeftCoords: function(zone) {
            return privZoneToTopLeftCoords(zone);
        },
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to those of the top left of the  */
        /* zone that contains them.                                          */
        /*-------------------------------------------------------------------*/
        coordsToTopLeftCoords: function (coords) {
            return privCoordsToTopLeftCoords(coords);
        },
        /*-------------------------------------------------------------------*/
        /* Calculate and return the distance, in zones, between two zones.   */
        /*-------------------------------------------------------------------*/
        zoneDistance: function (zone1, zone2) {
            var zone1Coords = privZoneToTopLeftCoords(zone1),
                zone2Coords = privZoneToTopLeftCoords(zone2),
                zone1Adj = {
                    x: zone1Coords.x - mapmargin < 0 ? 0 : zone1Coords.x - mapmargin,
                    y: zone1Coords.y - mapmargin < 0 ? 0 : zone1Coords.y - mapmargin
                },
                zone2Adj = {
                    x: zone2Coords.x - mapmargin < 0 ? 0 : zone2Coords.x - mapmargin,
                    y: zone2Coords.y - mapmargin < 0 ? 0 : zone2Coords.y - mapmargin
                },
                zonesX = Math.floor(Math.abs(zone1Adj.x - zone2Adj.x) / zonesize),
                zonesY = Math.floor(Math.abs(zone1Adj.y - zone2Adj.y) / zonesize);
            return Math.max(zonesX, zonesY);
        },
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to those of the top left of the  */
        /* area that contains them.                                          */
        /*-------------------------------------------------------------------*/
        coordsToAreaTopLeftCoords: function (coords) {
            return privZoneToTopLeftCoords(privCoordsToZone(coords).substr(0, 2) + "A");
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        clearCanvas: function () {
            ctx.clearRect(0, 0, cvs.width, cvs.height);
        },
        /*-------------------------------------------------------------------*/
        /* Draw the search map semi-transparently and size the canvas to     */
        /* match its dimensions. Add the atolls Kure and Midway with no      */
        /* transparency.                                                     */
        /*-------------------------------------------------------------------*/
        drawMap: function (callback) {
            var imgDir = "/content/images/search/",
                mapImg = new Image();

            mapImg.src = imgDir + "searchboard.png";
            mapImg.onload = function () {
                cvs.height = mapImg.height;
                cvs.width = mapImg.width;
                //ctx.save();
                //ctx.globalAlpha = 0.4;
                ctx.drawImage(mapImg, 0, 0);
                if (callback) callback();
                //ctx.restore();
            };
        },
        /*-------------------------------------------------------------------*/
        /* Grab preloaded sighting image and draw it at the input zone's     */
        /* canvas coordinates.                                               */
        /*-------------------------------------------------------------------*/
        drawSightingMarker: function (zone) {
            var topLeft = privZoneToTopLeftCoords(zone),
                sightingImg = document.getElementById("sighting");
            ctx.drawImage(sightingImg, topLeft.x, topLeft.y);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        highlightArrivalZones: function (side) {
            var topZone = side == "IJN" ? "A1A" : "I1B",
                bottomZone = side == "IJN" ? "A7D" : "I7E",
                topCoords = privZoneToTopLeftCoords(topZone),
                bottomCoords = addVectors(privZoneToTopLeftCoords(bottomZone), { x: zonesize, y: zonesize }),
                width = bottomCoords.x - topCoords.x,
                height = bottomCoords.y - topCoords.y;

            ctx.save();
            ctx.globalAlpha = 0.2;
            ctx.fillStyle = side == "USN" ? "#004a7f" : "#ff2b00";
            ctx.rect(topCoords.x, topCoords.y, width, height);
            ctx.fill();
            ctx.restore();
        },
        /*-------------------------------------------------------------------*/
        /* Grab preloaded fleet image and draw it at the input canvas        */
        /* coordinates (NOT converted to top left).                          */
        /*-------------------------------------------------------------------*/
        drawShipsMarker: function (coords) {
            var fleetImg = document.getElementById("fleet");
            ctx.drawImage(fleetImg, coords.x - zonesize, coords.y);
        },
        /*-------------------------------------------------------------------*/
        /* Draw yellow square selected zone marker at the input canvas       */
        /* top and left coordinates.                                         */
        /*-------------------------------------------------------------------*/
        drawSelector: function (topLeft, sizeInZones) {
            var top = topLeft.y,
                left = topLeft.x,
                sideLength = (sizeInZones * 36) + 5;

            if (sizeInZones == 1)
                selRemoveImage = ctx.getImageData(left, top, sideLength + 3, sideLength + 3);

            privDrawSelBox(left, top, sideLength);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        removeSelector: function (left, top) {
            ctx.putImageData(selRemoveImage, left, top);
        },
        /*-------------------------------------------------------------------*/
        /* Draw movement direction band and destination zone indicator       */
        /* during ship movement dragging.                                    */
        /*-------------------------------------------------------------------*/
        drawMoveBand: function (startZone, endCoords) {
            var start = privZoneToTopLeftCoords(startZone),
                topLeft = privCoordsToTopLeftCoords(endCoords);

            start.x += Math.floor(zonesize / 2);
            start.y += Math.floor(zonesize / 2);
            ctx.lineWidth = 2;
            ctx.lineCap = "round";
            ctx.strokeStyle = "#ff0000";
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(endCoords.x, endCoords.y);
            ctx.moveTo(topLeft.x, topLeft.y);
            ctx.lineTo(topLeft.x + zonesize, topLeft.y);
            ctx.lineTo(topLeft.x + zonesize, topLeft.y + zonesize);
            ctx.lineTo(topLeft.x, topLeft.y + zonesize);
            ctx.closePath();
            ctx.stroke();
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        grabImageData: function (left, top, width, height) {
            if (!left) {
                left = 0;
                top = 0;
                width = cvs.width;
                height = cvs.height;
            }
            return ctx.getImageData(left, top, width, height);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        restoreImageData: function (data, left, top) {
            ctx.putImageData(data, left, top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawSearchCursor: function (restoreData, imageData, left, top) {
            if (restoreData) {
                ctx.putImageData(restoreData, 0, 0);
            }
            var ret = ctx.getImageData(0, 0, cvs.width, cvs.height);
            ctx.drawImage(imageData, left, top);
            return ret;
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawOppSearchArea: function(area) {
            var coords = addVectors(privZoneToTopLeftCoords(area + "A"), { x: -3, y: -3 }),
                sideLength = (zonesize * 3) + 5;
            privDrawSelBox(coords.x, coords.y, sideLength);
        }
    };
})();