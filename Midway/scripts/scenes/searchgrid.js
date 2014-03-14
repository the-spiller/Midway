function SearchGrid() {
    this.zoneSize = 36;
    this.mapMargin = 27;
    this.mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
    this.cnvs = document.getElementById("searchcanvas"),
    this.ctx = this.cnvs.getContext("2d"),
    this.restImg = undefined;
}
// Prototype functions
SearchGrid.prototype = {
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to the name of the search map    */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToZone: function(coords) {
        var x = coords.x,
            y = coords.y;

        if (x < 28 || x > 962 || y < 28 || y > 746)
            return "";

        var zoneRow = (y - this.mapMargin) / this.zoneSize;
        var row = Math.floor(zoneRow / 3 + 1).toString();
        var areaRow = Math.floor(zoneRow % 3 + 1);

        var zoneCol = (x - this.mapMargin) / this.zoneSize;
        var colRow = this.mapCols[Math.floor(zoneCol / 3)] + row;
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
    /*-------------------------------------------------------------------*/
    /* Convert a zone name to its top left canvas coordinates.           */
    /*-------------------------------------------------------------------*/
    zoneToTopLeftCoords: function(zone) {
        var col = 0,
            areaSize = this.zoneSize * 3;
        
        for (var i = 0; i < this.mapCols.length; i++) {
            if (zone.charAt(0) == this.mapCols[i]) {
                col = (i * areaSize) + this.mapMargin;
                break;
            }
        }
        var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + this.mapMargin;
        switch (zone.substr(2, 1)) {
        case "B":
            col += this.zoneSize;
            break;
        case "C":
            col += this.zoneSize * 2;
            break;
        case "D":
            row += this.zoneSize;
            break;
        case "E":
            row += this.zoneSize;
            col += this.zoneSize;
            break;
        case "F":
            row += this.zoneSize;
            col += this.zoneSize * 2;
            break;
        case "G":
            row += this.zoneSize * 2;
            break;
        case "H":
            row += this.zoneSize * 2;
            col += this.zoneSize;
            break;
        case "I":
            row += this.zoneSize * 2;
            col += this.zoneSize * 2;
            break;
        }
        return { x: col, y: row };

    },
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToTopLeftCoords: function(coords) {
        var zonesX = coords.x - this.mapMargin < 0 ? 0 : Math.floor((coords.x - this.mapMargin) / this.zoneSize),
            zonesY = coords.y - this.mapMargin < 0 ? 0 : Math.floor((coords.y - this.mapMargin) / this.zoneSize);
        return { x: (zonesX * this.zoneSize) + this.mapMargin, y: (zonesY * this.zoneSize) + this.mapMargin };
    },
    /*-------------------------------------------------------------------*/
    /* Calculate and return the distance, in zones, between two zones.   */
    /*-------------------------------------------------------------------*/
    zoneDistance: function(zone1, zone2) {
        var zone1Coords = this.zoneToTopLeftCoords(zone1),
            zone2Coords = this.zoneToTopLeftCoords(zone2),
            zone1Adj = {
                x: zone1Coords.x - this.mapMargin < 0 ? 0 : zone1Coords.x - this.mapMargin,
                y: zone1Coords.y - this.mapMargin < 0 ? 0 : zone1Coords.y - this.mapMargin
            },
            zone2Adj = {
                x: zone2Coords.x - this.mapMargin < 0 ? 0 : zone2Coords.x - this.mapMargin,
                y: zone2Coords.y - this.mapMargin < 0 ? 0 : zone2Coords.y - this.mapMargin
            },
            zonesX = Math.floor(Math.abs(zone1Adj.x - zone2Adj.x) / this.zoneSize),
            zonesY = Math.floor(Math.abs(zone1Adj.y - zone2Adj.y) / this.zoneSize);
        return Math.max(zonesX, zonesY);
    },
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* area that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToAreaTopLeftCoords: function(coords) {
        return this.zoneToTopLeftCoords(this.coordsToZone(coords).substr(0, 2) + "A");
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    clearCanvas: function() {
        this.ctx.clearRect(0, 0, this.cnvs.width, this.cnvs.height);
    },
    /*-------------------------------------------------------------------*/
    /* Draw the search map semi-transparently and size the canvas to     */
    /* match its dimensions. Add the atolls Kure and Midway with no      */
    /* transparency.                                                     */
    /*-------------------------------------------------------------------*/
    drawMap: function(callback) {
        var my = this,
            imgDir = "content/images/search/",
            mapImg = new Image(),
            atollsImg = new Image();

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
    },
    /*-------------------------------------------------------------------*/
    /* Grab preloaded sighting image and draw it at the input zone's     */
    /* canvas coordinates.                                               */
    /*-------------------------------------------------------------------*/
    drawSightingMarker: function(zone) {
        var topLeft = this.zoneToTopLeftCoords(zone),
            sightingImg = document.getElementById("sighting");
        this.ctx.drawImage(sightingImg, topLeft.x, topLeft.y);
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    highlightArrivalZones: function(side) {
        var topZone = side == "IJN" ? "A1A" : "I1B",
            bottomZone = side == "IJN" ? "A7D" : "I7E",
            topCoords = this.zoneToTopLeftCoords(topZone),
            bottomCoords = addVectors(this.zoneToTopLeftCoords(bottomZone), { x: this.zoneSize, y: this.zoneSize }),
            width = bottomCoords.x - topCoords.x,
            height = bottomCoords.y - topCoords.y;

        this.restImg = this.ctx.getImageData(topCoords.x, topCoords.y, width, height);
        this.ctx.save();
        this.ctx.globalAlpha = 0.2;
        this.ctx.fillStyle = "#ffd651";
        this.ctx.rect(topCoords.x, topCoords.y, width, height);
        this.ctx.fill();
        this.ctx.restore();
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    removeArrivalZones: function(side) {
        var topCoords = this.zoneToTopLeftCoords(side == "IJN" ? "A1A" : "I1B");
        this.ctx.putImageData(this.restImg, topCoords.x, topCoords.y);
    },
    /*-------------------------------------------------------------------*/
    /* Grab preloaded fleet image and draw it at the input canvas        */
    /* coordinates (NOT converted to top left).                          */
    /*-------------------------------------------------------------------*/
    drawShipsMarker: function (coords) {
        var fleetImg = document.getElementById("fleet");
        this.ctx.drawImage(fleetImg, coords.x - this.zoneSize, coords.y);
    },
    /*-------------------------------------------------------------------*/
    /* Draw yellow square selected area/zone marker at the input canvas  */
    /* top and left coordinates.                                         */
    /*-------------------------------------------------------------------*/
    drawSelector: function (topLeft, sizeInZones) {
        var top = topLeft.y,
            left = topLeft.x,
            sideLength = (sizeInZones * 36) + 5;
        
        if (sizeInZones == 1)
            // area-sized selections are restored w/ search cursor, so we only need single zone
            this.restImg = this.ctx.getImageData(left, top, sideLength + 3, sideLength + 3);
        this.ctx.save();
        this.ctx.globalAlpha = 0.6;
        this.ctx.lineWidth = 4;
        this.ctx.strokeStyle = "#ffd651";
        this.ctx.beginPath();
        this.ctx.moveTo(left + 2, top + 2);
        this.ctx.lineTo(left + sideLength, top + 2);
        this.ctx.lineTo(left + sideLength, top + sideLength);
        this.ctx.lineTo(left + 2, top + sideLength);
        this.ctx.closePath();
        this.ctx.stroke();
        this.ctx.restore();
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    removeSelector: function (left, top) {
        this.ctx.putImageData(this.restImg, left, top);
    },
    /*-------------------------------------------------------------------*/
    /* Draw movement direction band and destination zone indicator       */
    /* during ship movement dragging.                                    */
    /*-------------------------------------------------------------------*/
    drawMoveBand: function (startZone, endCoords) {
        var start = this.zoneToTopLeftCoords(startZone),
            topLeft = this.coordsToTopLeftCoords(endCoords);

        start.x += Math.floor(this.zoneSize / 2);
        start.y += Math.floor(this.zoneSize / 2);
        this.ctx.lineWidth = 2;
        this.ctx.lineCap = "round";
        this.ctx.strokeStyle = "#ff0000";
        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(endCoords.x, endCoords.y);
        this.ctx.moveTo(topLeft.x, topLeft.y);
        this.ctx.lineTo(topLeft.x + this.zoneSize, topLeft.y);
        this.ctx.lineTo(topLeft.x + this.zoneSize, topLeft.y + this.zoneSize);
        this.ctx.lineTo(topLeft.x, topLeft.y + this.zoneSize);
        this.ctx.closePath();
        this.ctx.stroke();
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    grabImageData: function (left, top, width, height) {
        if (!left) {
            left = 0;
            top = 0;
            width = this.cnvs.width;
            height = this.cnvs.height;
        }
        return this.ctx.getImageData(left, top, width, height);
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    restoreImageData: function (data, left, top) {
        this.ctx.putImageData(data, left, top);
    },
    /*-------------------------------------------------------------------*/
    /*-------------------------------------------------------------------*/
    drawSearchCursor: function (restoreData, imageData, left, top) {
        if (restoreData) {
            this.ctx.putImageData(restoreData, 0, 0);
        }
        var ret = this.grabImageData();
        this.ctx.drawImage(imageData, left, top);
        return ret;
    }
};