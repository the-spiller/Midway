function SearchGrid() {
    this.zoneSize = 36;
    this.mapMargin = 27;
    this.mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
    this.cnvs = document.getElementById("searchcanvas"),
    this.ctx = this.cnvs.getContext("2d"),
    this.restImg = undefined;
}
// Prototype functions (using "closure")
SearchGrid.prototype = {
    coordsToZone: function(coords) {
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to the name of the search map    */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
        var my = this,
            x = coords.x,
            y = coords.y,
            doCalc = function() {
                if (x < 28 || x > 962 || y < 28 || y > 746)
                    return "";

                var zoneRow = (y - my.mapMargin) / my.zoneSize;
                var row = Math.floor(zoneRow / 3 + 1).toString();
                var areaRow = Math.floor(zoneRow % 3 + 1);

                var zoneCol = (x - my.mapMargin) / my.zoneSize;
                var colRow = my.mapCols[Math.floor(zoneCol / 3)] + row;
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
            };
        return doCalc();
    },
    zoneToTopLeftCoords: function(zone) {
    /*-------------------------------------------------------------------*/
    /* Convert a zone name to its top left canvas coordinates.           */
    /*-------------------------------------------------------------------*/
        var my = this,
            col = 0,
            doCalc = function() {
                var areaSize = my.zoneSize * 3;
                for (var i = 0; i < my.mapCols.length; i++) {
                    if (zone.charAt(0) == my.mapCols[i]) {
                        col = (i * areaSize) + my.mapMargin;
                        break;
                    }
                }
                var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + my.mapMargin;
                switch (zone.substr(2, 1)) {
                case "B":
                    col += my.zoneSize;
                    break;
                case "C":
                    col += my.zoneSize * 2;
                    break;
                case "D":
                    row += my.zoneSize;
                    break;
                case "E":
                    row += my.zoneSize;
                    col += my.zoneSize;
                    break;
                case "F":
                    row += my.zoneSize;
                    col += my.zoneSize * 2;
                    break;
                case "G":
                    row += my.zoneSize * 2;
                    break;
                case "H":
                    row += my.zoneSize * 2;
                    col += my.zoneSize;
                    break;
                case "I":
                    row += my.zoneSize * 2;
                    col += my.zoneSize * 2;
                    break;
                }
                return { x: col, y: row };
            };
        return doCalc();
    },
    coordsToTopLeftCoords: function(coords) {
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
        var my = this,
            doCalc = function() {
                var zonesX = coords.x - my.mapMargin < 0 ? 0 : Math.floor((coords.x - my.mapMargin) / my.zoneSize),
                    zonesY = coords.y - my.mapMargin < 0 ? 0 : Math.floor((coords.y - my.mapMargin) / my.zoneSize);
                return { x: (zonesX * my.zoneSize) + my.mapMargin, y: (zonesY * my.zoneSize) + my.mapMargin };
            };
        return doCalc();
    },
    zoneDistance: function(zone1, zone2) {
    /*-------------------------------------------------------------------*/
    /* Calculate and return the distance, in zones, between two zones.   */
    /*-------------------------------------------------------------------*/
        var my = this,
            doCalc = function() {
                var zone1Coords = my.zoneToTopLeftCoords(zone1),
                    zone2Coords = my.zoneToTopLeftCoords(zone2),
                    zone1Adj = {
                        x: zone1Coords.x - my.mapMargin < 0 ? 0 : zone1Coords.x - my.mapMargin,
                        y: zone1Coords.y - my.mapMargin < 0 ? 0 : zone1Coords.y - my.mapMargin
                    },
                    zone2Adj = {
                        x: zone2Coords.x - my.mapMargin < 0 ? 0 : zone2Coords.x - my.mapMargin,
                        y: zone2Coords.y - my.mapMargin < 0 ? 0 : zone2Coords.y - my.mapMargin
                    },
                    zonesX = Math.floor(Math.abs(zone1Adj.x - zone2Adj.x) / my.zoneSize),
                    zonesY = Math.floor(Math.abs(zone1Adj.y - zone2Adj.y) / my.zoneSize);
                return Math.max(zonesX, zonesY);
            };
        return doCalc();
    },
    coordsToAreaTopLeftCoords: function(coords) {
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* area that contains them.                                          */
    /*-------------------------------------------------------------------*/
        var my = this,
            doCalc = function() {
                return my.zoneToTopLeftCoords(my.coordsToZone(coords).substr(0, 2) + "A");
            };
        return doCalc();
    },
    clearCanvas: function() {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                my.ctx.clearRect(0, 0, my.cnvs.width, my.cnvs.height);
            };
        doWork();
    },
    drawMap: function(callback) {
    /*-------------------------------------------------------------------*/
    /* Draw the search map semi-transparently and size the canvas to     */
    /* match its dimensions. Add the atolls Kure and Midway with no      */
    /* transparency.                                                     */
    /*-------------------------------------------------------------------*/
        var my = this,
            imgDir = "content/images/search/",
            mapImg = new Image(),
            atollsImg = new Image(),
            doWork = function() {
                mapImg.src = imgDir + "searchboard.png";
                mapImg.onload = function() {
                    my.cnvs.height = mapImg.height;
                    my.cnvs.width = mapImg.width;
                    my.ctx.save();
                    my.ctx.globalAlpha = 0.4;
                    my.ctx.drawImage(mapImg, 0, 0);
                    my.ctx.restore();

                    atollsImg.src = imgDir + "atolls.png";
                    atollsImg.onload = function() {
                        my.ctx.drawImage(atollsImg, 711, 495);
                        if (callback) callback();
                    };
                };
            };
        doWork();
    },
    drawSightingMarker: function(zone) {
    /*-------------------------------------------------------------------*/
    /* Grab preloaded sighting image and draw it at the input zone's     */
    /* canvas coordinates.                                               */
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                var topLeft = my.zoneToTopLeftCoords(zone),
                    sightingImg = document.getElementById("sighting");
                my.ctx.drawImage(sightingImg, topLeft.x, topLeft.y);
            };
        doWork();
    },
    highlightArrivalZones: function(side) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            topZone = side == "IJN" ? "A1A" : "I1B",
            bottomZone = side == "IJN" ? "A7D" : "I7E",
            doWork = function() {
                var topCoords = my.zoneToTopLeftCoords(topZone),
                    bottomCoords = addVectors(my.zoneToTopLeftCoords(bottomZone), { x: my.zoneSize, y: my.zoneSize }),
                    width = bottomCoords.x - topCoords.x,
                    height = bottomCoords.y - topCoords.y;

                my.restImg = my.ctx.getImageData(topCoords.x, topCoords.y, width, height);
                my.ctx.save();
                my.ctx.globalAlpha = 0.2;
                my.ctx.fillStyle = "#ffd651";
                my.ctx.rect(topCoords.x, topCoords.y, width, height);
                my.ctx.fill();
                my.ctx.restore();
            };
        doWork();
    },
    removeArrivalZones: function(side) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                var topCoords = my.zoneToTopLeftCoords(side == "IJN" ? "A1A" : "I1B");
                my.ctx.putImageData(my.restImg, topCoords.x, topCoords.y);
            };
        doWork();
    },
    drawShipsMarker: function (coords) {
    /*-------------------------------------------------------------------*/
    /* Grab preloaded fleet image and draw it at the input canvas        */
    /* coordinates (NOT converted to top left).                          */
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                var fleetImg = document.getElementById("fleet");
                my.ctx.drawImage(fleetImg, coords.x - my.zoneSize, coords.y);
            };
        doWork();
    },
    drawSelector: function (topLeft, sizeInZones) {
    /*-------------------------------------------------------------------*/
    /* Draw yellow square selected area/zone marker at the input canvas  */
    /* top and left coordinates.                                         */
    /*-------------------------------------------------------------------*/
        var my = this,
            top = topLeft.y,
            left = topLeft.x,
            sideLength = (sizeInZones * 36) + 5,
            doWork = function() {
                if (sizeInZones == 1)
                    // area-sized selections are restored w/ search cursor, so we only need single zone
                    my.restImg = my.ctx.getImageData(left, top, sideLength + 3, sideLength + 3);
                my.ctx.save();
                my.ctx.globalAlpha = 0.6;
                my.ctx.lineWidth = 4;
                my.ctx.strokeStyle = "#ffd651";
                my.ctx.beginPath();
                my.ctx.moveTo(left + 2, top + 2);
                my.ctx.lineTo(left + sideLength, top + 2);
                my.ctx.lineTo(left + sideLength, top + sideLength);
                my.ctx.lineTo(left + 2, top + sideLength);
                my.ctx.closePath();
                my.ctx.stroke();
                my.ctx.restore();
            };
        doWork();
    },
    removeSelector: function (left, top) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                my.ctx.putImageData(my.restImg, left, top);
            };
        doWork();
    },
    drawMoveBand: function (startZone, endCoords) {
    /*-------------------------------------------------------------------*/
    /* Draw movement direction band and destination zone indicator       */
    /* during ship movement dragging.                                    */
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                var start = my.zoneToTopLeftCoords(startZone),
                    topLeft = my.coordsToTopLeftCoords(endCoords);

                start.x += Math.floor(my.zoneSize / 2);
                start.y += Math.floor(my.zoneSize / 2);

                my.ctx.lineWidth = 2;
                my.ctx.lineCap = "round";
                my.ctx.strokeStyle = "#ff0000";
                my.ctx.beginPath();
                my.ctx.moveTo(start.x, start.y);
                my.ctx.lineTo(endCoords.x, endCoords.y);
                my.ctx.moveTo(topLeft.x, topLeft.y);
                my.ctx.lineTo(topLeft.x + my.zoneSize, topLeft.y);
                my.ctx.lineTo(topLeft.x + my.zoneSize, topLeft.y + my.zoneSize);
                my.ctx.lineTo(topLeft.x, topLeft.y + my.zoneSize);
                my.ctx.closePath();
                my.ctx.stroke();
            };
        doWork();
    },
    grabImageData: function (left, top, width, height) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            grabIt = function() {
                if (!left) {
                    left = 0;
                    top = 0;
                    width = my.cnvs.width;
                    height = my.cnvs.height;
                }
                return my.ctx.getImageData(left, top, width, height);
            };
        return grabIt();
    },
    restoreImageData: function (data, left, top) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            doWork = function() {
                my.ctx.putImageData(data, left, top);
            };
        doWork();
    },
    drawSearchCursor: function (restoreData, imageData, left, top) {
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
        var my = this,
            drawIt = function() {
                if (restoreData) {
                    my.ctx.putImageData(restoreData, 0, 0);
                }
                var ret = my.grabImageData();
                my.ctx.drawImage(imageData, left, top);
                return ret;
            };
        return drawIt();
    }
};