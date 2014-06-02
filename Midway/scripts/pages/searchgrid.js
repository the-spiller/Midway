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
        cloudsCvs, cloudsCtx,
        selectedZoneRestoreData = null,
        selectedAreaRestoreData = null,
        highlightRestoreData = null,
        //functions called internally
        privZoneToTopLeftCoords = function(zone) {
            var areaSize = zonesize * 3,
                col = (privGetMapColsIndex(zone.charAt(0)) * areaSize) + mapmargin;

            var row = ((Number(zone.charAt(1)) - 1) * areaSize) + mapmargin;
            switch (zone.charAt(2)) {
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
        privGetZoneLetter = function(innerRow, innerCol) {
            var z = (innerRow * 10) + innerCol;
            if (z == 0) return "A";
            if (z == 1) return "B";
            if (z == 2) return "C";
            if (z == 10) return "D";
            if (z == 11) return "E";
            if (z == 12) return "F";
            if (z == 20) return "G";
            if (z == 21) return "H";
            return "I";
        },
        privCoordsToZone = function(coords) {
            var x = coords.x,
                y = coords.y;

            if (x < 28 || x > 962 || y < 28 || y > 746)
                return "";

            var zonesY = (y - mapmargin) / zonesize,
                row = (Math.floor(zonesY / 3) + 1).toString(),
                innerRow = Math.floor(zonesY % 3),
                zonesX = (x - mapmargin) / zonesize,
                col = mapCols[Math.floor(zonesX / 3)],
                innerCol = Math.floor(zonesX % 3);
            
            return col + row + privGetZoneLetter(innerRow, innerCol);
        },
        privCoordsToTopLeftCoords = function(coords) {
            var zonesX = coords.x - mapmargin < 0 ? 0 : Math.floor((coords.x - mapmargin) / zonesize),
                zonesY = coords.y - mapmargin < 0 ? 0 : Math.floor((coords.y - mapmargin) / zonesize);
            return { x: (zonesX * zonesize) + mapmargin, y: (zonesY * zonesize) + mapmargin };
        },
        privGetMapColsIndex = function(colLetter) {
            for (var i = 0; i < mapCols.length; i++) {
                if (colLetter == mapCols[i]) {
                    return i;
                }
            }
            return -1;
        },
        privGetRelativeZone = function (zone, vector) {
            if (vector.x == 0 && vector.y == 0) return zone;
            
            //Convert zone designation to a count of zones in x and y directions
            // and add vector values (also in zones).
            var colIdx = privGetMapColsIndex(zone.charAt(0)),
                zonesX = colIdx * 3,
                zonesY = (Number(zone.charAt(1)) - 1) * 3,
                z = zone.charAt(2),
                zCol = "CFI".indexOf(z) > -1 ? 2 : "BEH".indexOf(z) > -1 ? 1 : 0,
                zRow = "GHI".indexOf(z) > -1 ? 2 : "DEF".indexOf(z) > -1 ? 1 : 0;

            zonesX = zonesX + zCol + vector.x;
            zonesY = zonesY + zRow + vector.y;
            
            //Don't go off the map edge.
            if (zonesX < 0) zonesX = 0; else if (zonesX > 25) zonesX = 25;
            if (zonesY < 0) zonesY = 0; else if (zonesY > 19) zonesY = 19;

            //Convert results back to a zone designation.
            var col = mapCols[Math.floor(zonesX / 3)],
                innerCol = Math.floor(zonesX % 3),
                row = (Math.floor(zonesY / 3) + 1).toString(),
                innerRow = Math.floor(zonesY % 3);
            
            return col + row + privGetZoneLetter(innerRow, innerCol);
        },
        privGetContextByIndex = function (idx) {
            if (idx == 1) return iconsCtx;
            if (idx == 2) return cloudsCtx;
            return mapCtx;
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
        zoneSize: zonesize,
        mapMargin: mapmargin,
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
        getRelativeZone: function(zone, vector) {
            return privGetRelativeZone(zone, vector);
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
        clearCanvas: function (canvasIdx) {
            var ctx = privGetContextByIndex(canvasIdx);
            ctx.clearRect(0, 0, mapCvs.width, mapCvs.height);
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
                iconsCvs.height = mapImg.height;
                iconsCvs.width = mapImg.width;
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
        /* Highlight a rectangular range of map zones and return a list of   */
        /* the included zones.                                               */
        /*-------------------------------------------------------------------*/
        highlightZones: function (topLeftZone, zonesWidth, zonesHeight) {
            var topLeftCoords = privZoneToTopLeftCoords(topLeftZone),
                width = zonesWidth * zonesize,
                height = zonesHeight * zonesize,
                bottomRightCoords = addVectors(topLeftCoords, { x: width, y: height });

            highlightRestoreData = {
                data: iconsCtx.getImageData(topLeftCoords.x, topLeftCoords.y, width, height),
                top: topLeftCoords.y,
                left: topLeftCoords.x
            };

            iconsCtx.save();
            iconsCtx.globalAlpha = 0.2;
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
            var zones = [], zone;
            for (var x = 0; x < zonesWidth; x++) {
                for (var y = 0; y < zonesHeight; y++) {
                    zone = privGetRelativeZone(topLeftZone, { x: x, y: y });
                    zones.push(zone);
                }
            }
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
        addCloudsCanvas: function() {
            cloudsCvs = document.createElement("canvas");
            cloudsCvs.id = "cloudscanvas";
            cloudsCvs.height = gridHeight;
            cloudsCvs.width = gridWidth;
            cloudsCvs.style.position = "absolute";
            cloudsCvs.style.top = mapCvs.style.top;
            cloudsCvs.style.left = mapCvs.style.left;
            cloudsCvs.style.zIndex = 20;
           
            var div = document.getElementById("canvii");
            div.appendChild(cloudsCvs);

            cloudsCtx = cloudsCvs.getContext("2d");
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawSearchClouds: function (opacity, coords) {
            privDrawSearchClouds(opacity, coords);
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
