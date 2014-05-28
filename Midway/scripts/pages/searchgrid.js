var searchGrid = (function() {
    var zonesize = 36,
        mapmargin = 27,
        gridHeight = 748,
        gridWidth = 964,
        mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
        mapCvs = document.getElementById("mapcanvas"),
        mapCtx = mapCvs.getContext("2d"),
        iconsCvs = document.getElementById("iconscanvas"),
        iconsCtx = iconsCvs.getContext("2d"),
        cloudsCvs, cloudsCtx, searchCursorCvs, searchCursorCtx,
        selectedZoneRestoreData = null,
        selectedAreaRestoreData = null,
        highlightRestoreData = null,
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
        privGetContextByIndex = function(idx) {
            if (idx == 1) return iconsCtx;
            if (idx == 2) return cloudsCtx;
            if (idx == 3) return searchCursorCtx;
            return mapCtx;
        },
        nextZoneX = function (zone) {
            var z = zone.charAt(2),
                area = zone.substr(0, 2);
            if (z == "A") return area + "B";
            if (z == "B") return area + "C";
            if (z == "D") return area + "E";
            if (z == "E") return area + "F";
            if (z == "G") return area + "H";
            if (z == "H") return area + "I";

            for (var i = 0; i < mapCols.length - 1; i++) {
                if (area.charAt(0) == mapCols[i]) {
                    area = mapCols[i + 1] + area.charAt(1);
                    break;
                }
            }
            if (z == "C") return area + "A";
            if (z == "F") return area + "D";
            return area + "G";
        },
        nextZoneY = function (zone) {
            var z = zone.charAt(2),
                area = zone.substr(0, 2);
            if (z == "A") return area + "D";
            if (z == "B") return area + "E";
            if (z == "C") return area + "F";
            if (z == "D") return area + "G";
            if (z == "E") return area + "H";
            if (z == "F") return area + "I";

            area = area.charAt(0) + (Number(area.charAt(1)) + 1);
            if (z == "G") return area + "A";
            if (z == "H") return area + "B";
            return area + "C";
        },
        privDrawSelBox = function(left, top, sideLength) {
            mapCtx.save();
            mapCtx.globalAlpha = 0.6;
            mapCtx.lineWidth = 4;
            mapCtx.strokeStyle = "#ffd651";
            mapCtx.beginPath();
            mapCtx.moveTo(left + 2, top + 2);
            mapCtx.lineTo(left + sideLength, top + 2);
            mapCtx.lineTo(left + sideLength, top + sideLength);
            mapCtx.lineTo(left + 2, top + sideLength);
            mapCtx.closePath();
            mapCtx.stroke();
            mapCtx.restore();
        },
        privDrawSearchClouds = function(opacity, coords) {
            if (!cloudsCtx) return;
            var clouds = document.getElementById("cloudLayer");
            cloudsCtx.clearRect(0, 0, gridWidth, gridHeight);
            cloudsCtx.globalAlpha = opacity;
            cloudsCtx.drawImage(clouds, coords.x, coords.y);
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
        /* Calculate and return the distance in zones between two zones.     */
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
        clearMapCanvas: function () {
            mapCtx.clearRect(0, 0, mapCvs.width, mapCvs.height);
        },
        /*-------------------------------------------------------------------*/
        /* Draw the search map semi-transparently and size the canvas to     */
        /* match its dimensions. Add the atolls Kure and Midway with no      */
        /* transparency.                                                     */
        /*-------------------------------------------------------------------*/
        drawMap: function (callback) {
            var mapImg = new Image();
            mapImg.src = "/content/images/search/searchboard.png";
            mapImg.onload = function () {
                mapCvs.height = mapImg.height;
                mapCvs.width = mapImg.width;
                mapCtx.drawImage(mapImg, 0, 0);
                if (callback) callback();
            };
        },
        /*-------------------------------------------------------------------*/
        /* Grab preloaded sighting image and draw it at the input zone's     */
        /* canvas coordinates.                                               */
        /*-------------------------------------------------------------------*/
        drawSightingMarker: function (zone, age) {
            var topLeft = privZoneToTopLeftCoords(zone),
                sightingImg = document.getElementById("sighting");
            
            iconsCtx.save();
            if (age > 0) {
                iconsCtx.globalAlpha = 1 - (age * 0.2);
            }
            iconsCtx.drawImage(sightingImg, topLeft.x, topLeft.y);
            iconsCtx.restore();
        },
        /*-------------------------------------------------------------------*/
        /* Grab preloaded fleet image and draw it at the input zone top left */
        /* coordinates.                                                      */
        /*-------------------------------------------------------------------*/
        drawShipsMarker: function (coords) {
            var fleetImg = document.getElementById("fleet");
            iconsCtx.drawImage(fleetImg, coords.x - zonesize, coords.y);
        },
        /*-------------------------------------------------------------------*/
        /* Draw yellow square selected zone marker at the input canvas       */
        /* top left coordinates.                                             */
        /*-------------------------------------------------------------------*/
        drawSelector: function (topLeft, sizeInZones) {
            var top = topLeft.y,
                left = topLeft.x,
                sideLength = (sizeInZones * zonesize) + 5,
                savedData = mapCtx.getImageData(left, top, sideLength + 3, sideLength + 3);
            
            if (sizeInZones == 1)
                selectedZoneRestoreData = savedData;
            else
                selectedAreaRestoreData = savedData;
            
            privDrawSelBox(left, top, sideLength);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        removeZoneSelector: function (left, top) {
            mapCtx.putImageData(selectedZoneRestoreData, left, top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        removeAreaSelector: function (left, top) {
            mapCtx.putImageData(selectedAreaRestoreData, left, top);
        },
        /*-------------------------------------------------------------------*/
        /* Highlight a range of map zones and return an array of those zones.*/
        /*-------------------------------------------------------------------*/
        highlightZones: function (topLeftZone, bottomRightZone) {
            var topLeftCoords = privZoneToTopLeftCoords(topLeftZone),
                bottomRightCoords = addVectors(privZoneToTopLeftCoords(bottomRightZone), { x: zonesize, y: zonesize }),
                height = bottomRightCoords.y - topLeftCoords.y,
                width = bottomRightCoords.x - topLeftCoords.x,
                zonesY = Math.floor(height / zonesize),
                zonesX = Math.floor(width / zonesize);

            highlightRestoreData = {
                data: iconsCtx.getImageData(topLeftCoords.x, topLeftCoords.y, width, height),
                top: topLeftCoords.y,
                left: topLeftCoords.x
            };
            
            iconsCtx.save();
            iconsCtx.globalAlpha = 0.3;
            iconsCtx.fillStyle = "#ffffff";
            iconsCtx.beginPath();
            iconsCtx.moveTo(topLeftCoords.x, topLeftCoords.y);
            iconsCtx.lineTo(bottomRightCoords.x, topLeftCoords.y);
            iconsCtx.lineTo(bottomRightCoords.x, bottomRightCoords.y);
            iconsCtx.lineTo(topLeftCoords.x, bottomRightCoords.y);
            iconsCtx.closePath();
            iconsCtx.fill();
            iconsCtx.restore();
            
            // build up array of zones to return
            var zones = [topLeftZone],
                zoneX = topLeftZone,
                zoneY;
            
            for (var i = 0; i < zonesX; i++) {
                if (i > 0) {
                    zoneX = nextZoneX(zoneX);
                    zones.push(zoneX);
                }
                zoneY = nextZoneY(zoneX);
                zones.push(zoneY);
                
                for (var j = 1; j < zonesY; j++) {
                    zoneY = nextZoneY(zoneY);
                    zones.push(zoneY);
                }
            }
            console.log(zones);
            return zones;
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        removeHighlight: function () {
            iconsCtx.putImageData(highlightRestoreData.data, highlightRestoreData.left, highlightRestoreData.top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        grabImageData: function (canvasIdx, left, top, width, height) {
            var ctx = privGetContextByIndex(canvasIdx);
            if (!left) {
                left = 0;
                top = 0;
                width = mapCvs.width;
                height = mapCvs.height;
            }
            return ctx.getImageData(left, top, width, height);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        restoreImageData: function (canvasIdx, data, left, top) {
            var ctx = privGetContextByIndex(canvasIdx);
            ctx.putImageData(data, left, top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        addSearchCanvases: function() {
            cloudsCvs = document.createElement("canvas");
            cloudsCvs.id = "cloudscanvas";
            cloudsCvs.height = gridHeight;
            cloudsCvs.width = gridWidth;
            cloudsCvs.style.position = "absolute";
            cloudsCvs.style.top = "60px";
            cloudsCvs.style.left = mapCvs.style.left;
            cloudsCvs.style.zIndex = 20;

            searchCursorCvs = document.createElement("canvas");
            searchCursorCvs.id = "searchcursorcanvas";
            searchCursorCvs.height = gridHeight;
            searchCursorCvs.width = gridWidth;
            searchCursorCvs.style.position = "absolute";
            searchCursorCvs.style.top = "60px";
            searchCursorCvs.style.left = mapCvs.style.left;
            searchCursorCvs.style.zIndex = 30;
           
            var div = document.getElementById("canvii");
            div.appendChild(cloudsCvs);
            div.appendChild(searchCursorCvs);

            cloudsCtx = cloudsCvs.getContext("2d");
            searchCursorCtx = searchCursorCvs.getContext("2d");
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawSearchClouds: function (opacity, coords) {
            privDrawSearchClouds(opacity, coords);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawSearchCursor: function (left, top) {
            if (!searchCursorCtx) return;
            searchCursorCtx.clearRect(0, 0, gridWidth, gridHeight);
            searchCursorCtx.drawImage(searchCursorImg, left, top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        clearSearchCursor: function() {
            if (!searchCursorCtx) return;
            searchCursorCtx.clearRect(0, 0, gridWidth, gridHeight);
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
