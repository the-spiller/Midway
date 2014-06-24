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
        cloudsCvs,
        cloudsCtx,
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
            return new Vector2D(col, row);
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
            return new Vector2D((zonesX * zonesize) + mapmargin, (zonesY * zonesize) + mapmargin);
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
        },
        privDrawArrow = function (startCoords, endCoords, headStyle, whichEnd, headAngle, headLen) {
            var angle1, topx, topy, angle2, botx, boty,
                drawHead = function(x0, y0, x1, y1, x2, y2) {
                    var cp1X, cp1Y, cp2X, cp2Y, backdist;
                    //var radius = 3;
                    //var twoPI = 2 * Math.PI;

                    // all cases do this.
                    iconsCtx.save();
                    iconsCtx.beginPath();
                    iconsCtx.moveTo(x0, y0);
                    iconsCtx.lineTo(x1, y1);
                    iconsCtx.lineTo(x2, y2);
                    switch (headStyle) {
                        case 0:
                            // curved filled, add the bottom as an arcTo curve and fill
                            backdist = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                            iconsCtx.arcTo(x1, y1, x0, y0, .55 * backdist);
                            iconsCtx.fill();
                            break;
                        case 1:
                            // straight filled, add the bottom as a line and fill.
                            iconsCtx.beginPath();
                            iconsCtx.moveTo(x0, y0);
                            iconsCtx.lineTo(x1, y1);
                            iconsCtx.lineTo(x2, y2);
                            iconsCtx.lineTo(x0, y0);
                            iconsCtx.fill();
                            break;
                        case 2:
                            // unfilled head, just stroke.
                            iconsCtx.stroke();
                            break;
                        case 3:
                            //filled head, add the bottom as a quadraticCurveTo curve and fill
                            var cpx = (x0 + x1 + x2) / 3,
                                cpy = (y0 + y1 + y2) / 3;
                            iconsCtx.quadraticCurveTo(cpx, cpy, x0, y0);
                            iconsCtx.fill();
                            break;
                        case 4:
                            //filled head, add the bottom as a bezierCurveTo curve and fill
                            var shiftamt = 5;
                            if (x2 == x0) {
                                // Avoid a divide by zero if x2==x0
                                backdist = y2 - y0;
                                cp1X = (x1 + x0) / 2;
                                cp2X = (x1 + x0) / 2;
                                cp1Y = y1 + backdist / shiftamt;
                                cp2Y = y1 - backdist / shiftamt;
                            } else {
                                backdist = Math.sqrt(((x2 - x0) * (x2 - x0)) + ((y2 - y0) * (y2 - y0)));
                                var xback = (x0 + x2) / 2;
                                var yback = (y0 + y2) / 2;
                                var xmid = (xback + x1) / 2;
                                var ymid = (yback + y1) / 2;

                                var m = (y2 - y0) / (x2 - x0);
                                var dx = (backdist / (2 * Math.sqrt(m * m + 1))) / shiftamt;
                                var dy = m * dx;
                                cp1X = xmid - dx;
                                cp1Y = ymid - dy;
                                cp2X = xmid + dx;
                                cp2Y = ymid + dy;
                            }

                            iconsCtx.bezierCurveTo(cp1X, cp1Y, cp2X, cp2Y, x0, y0);
                            iconsCtx.fill();
                            break;
                    }
                    iconsCtx.restore();
                };
            
            headStyle = typeof (headStyle) != 'undefined' ? headStyle : 3;
            whichEnd = typeof (whichEnd) != 'undefined' ? whichEnd : 1; // end point gets arrow
            headAngle = typeof (headAngle) != 'undefined' ? headAngle : Math.PI / 8;
            headLen = typeof (headLen) != 'undefined' ? headLen : 10;
            // default to using drawHead to draw the head, but if the style
            // argument is a function, use it instead
            var toDrawHead = typeof (headStyle) != 'function' ? drawHead : headStyle;

            // For ends with arrow we actually want to stop before we get to the arrow
            // so that wide lines won't put a flat end on the arrow.
            var dist = Math.sqrt((endCoords.x - startCoords.x) * (endCoords.x - startCoords.x) + (endCoords.y - startCoords.y) * (endCoords.y - startCoords.y));
            var ratio = (dist - headLen / 3) / dist;
            var tox, toy, fromx, fromy;
            if (whichEnd & 1) {
                tox = Math.round(startCoords.x + (endCoords.x - startCoords.x) * ratio);
                toy = Math.round(startCoords.y + (endCoords.y - startCoords.y) * ratio);
            } else {
                tox = endCoords.x;
                toy = endCoords.y;
            }
            if (whichEnd & 2) {
                fromx = startCoords.x + (endCoords.x - startCoords.x) * (1 - ratio);
                fromy = startCoords.y + (endCoords.y - startCoords.y) * (1 - ratio);
            } else {
                fromx = startCoords.x;
                fromy = startCoords.y;
            }

            // Draw the shaft of the arrow
            iconsCtx.beginPath();
            iconsCtx.moveTo(fromx, fromy);
            iconsCtx.lineTo(tox, toy);
            iconsCtx.stroke();

            // calculate the angle of the line
            var lineangle = Math.atan2(endCoords.y - startCoords.y, endCoords.x - startCoords.x);
            // h is the line length of a side of the arrow head
            var h = Math.abs(headLen / Math.cos(headAngle));

            if (whichEnd & 1) {	// handle far end arrow head
                angle1 = lineangle + Math.PI + headAngle;
                topx = endCoords.x + Math.cos(angle1) * h;
                topy = endCoords.y + Math.sin(angle1) * h;
                angle2 = lineangle + Math.PI - headAngle;
                botx = endCoords.x + Math.cos(angle2) * h;
                boty = endCoords.y + Math.sin(angle2) * h;
                toDrawHead(topx, topy, endCoords.x, endCoords.y, botx, boty, headStyle);
            }
            if (whichEnd & 2) { // handle near end arrow head
                angle1 = lineangle + headAngle;
                topx = startCoords.x + Math.cos(angle1) * h;
                topy = startCoords.y + Math.sin(angle1) * h;
                angle2 = lineangle - headAngle;
                botx = startCoords.x + Math.cos(angle2) * h;
                boty = startCoords.y + Math.sin(angle2) * h;
                toDrawHead(topx, topy, startCoords.x, startCoords.y, botx, boty, headStyle);
            }
        };
    return {
        // read-only public props
        zoneSize: zonesize,
        mapMargin: mapmargin,
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to the name of the search map    */
        /* zone that contains them.                                          */
        /*-------------------------------------------------------------------*/
        coordsToZone: function(coords) {
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
        coordsToTopLeftCoords: function(coords) {
            return privCoordsToTopLeftCoords(coords);
        },
        getRelativeZone: function(zone, vector) {
            return privGetRelativeZone(zone, vector);
        },
        /*-------------------------------------------------------------------*/
        /* Calculate and return the distance in zones between two zones.     */
        /*-------------------------------------------------------------------*/
        zoneDistance: function(zone1, zone2) {
            if (zone1 == zone2) return 0;
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
        coordsToAreaTopLeftCoords: function(coords) {
            return privZoneToTopLeftCoords(privCoordsToZone(coords).substr(0, 2) + "A");
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        clearCanvas: function(canvasIdx) {
            var ctx = privGetContextByIndex(canvasIdx);
            ctx.clearRect(0, 0, mapCvs.width, mapCvs.height);
        },
        /*-------------------------------------------------------------------*/
        /* Draw the search map semi-transparently and size the canvas to     */
        /* match its dimensions. Add the atolls Kure and Midway with no      */
        /* transparency.                                                     */
        /*-------------------------------------------------------------------*/
        drawMap: function(callback) {
            var mapImg = new Image();
            mapImg.src = "/content/images/search/searchboard.png";
            mapImg.onload = function() {
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
        drawSightingMarker: function(zone, age) {
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
        drawShipsMarker: function(coords) {
            var fleetImg = document.getElementById("fleet");
            iconsCtx.drawImage(fleetImg, coords.x - zonesize, coords.y);
        },
        /*-------------------------------------------------------------------*/
        /* Draw yellow square selected zone marker at the input canvas       */
        /* top left coordinates.                                             */
        /*-------------------------------------------------------------------*/
        drawSelector: function(coords, sizeInZones) {
            var top = coords.y,
                left = coords.x,
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
        removeZoneSelector: function(left, top) {
            mapCtx.putImageData(selectedZoneRestoreData, left, top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        removeAreaSelector: function(left, top) {
            mapCtx.putImageData(selectedAreaRestoreData, left, top);
        },
        /*-------------------------------------------------------------------*/
        /* Highlight a rectangular range of map zones and return a list of   */
        /* the included zones.                                               */
        /*-------------------------------------------------------------------*/
        highlightZones: function(topLeftZone, zonesWidth, zonesHeight) {
            var topLeftCoords = privZoneToTopLeftCoords(topLeftZone),
                width = zonesWidth * zonesize,
                height = zonesHeight * zonesize,
                bottomRightCoords = { x: topLeftCoords.x + width, y: topLeftCoords.y + height };

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
        removeHighlight: function() {
            iconsCtx.putImageData(highlightRestoreData.data, highlightRestoreData.left, highlightRestoreData.top);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        grabImageData: function(canvasIdx, left, top, width, height) {
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
        restoreImageData: function(canvasIdx, data, left, top) {
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
            cloudsCvs.style.top = window.mapTop + "px";
            cloudsCvs.style.left = window.mapLeft + "px";
            cloudsCvs.style.zIndex = 20;

            var div = document.getElementById("canvii");
            div.appendChild(cloudsCvs);

            cloudsCtx = cloudsCvs.getContext("2d");
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawSearchClouds: function(opacity, coords) {
            privDrawSearchClouds(opacity, coords);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        drawOppSearchArea: function (area) {
            var vector = new privZoneToTopLeftCoords(area + "A"),
                offset = new Vector2D(-3, -3),
                sideLength = (zonesize * 3) + 5;

            vector.add(offset);
            privDrawSelBox(vector.x, vector.y, sideLength);
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        showAttacksFrom: function (sourceLocations) {
            if (sourceLocations.length) {
                highlightRestoreData = iconsCtx.getImageData(0, 0, iconsCvs.width, iconsCvs.height);
                for (var i = 0; i < sourceLocations.length; i++) {
                    var sourceVector = privZoneToTopLeftCoords(sourceLocations[i]),
                        targetVector = privZoneToTopLeftCoords(window.selectedZone),
                        flagOffset = new Vector2D(3, 8),
                        arrowStartOffset = new Vector2D(15, 8),
                        arrowEndOffset = new Vector2D(18, 18),
                        img = document.getElementById("enemyflag");

                    sourceVector.add(flagOffset);
                    iconsCtx.drawImage(img, sourceVector.x, sourceVector.y);
                    
                    //arrow
                    sourceVector.add(arrowStartOffset);
                    targetVector.add(arrowEndOffset);
                    //var arrowStart = Vector2D.fromAngle(getAngle(sourceVector, targetVector), 44),
                    //    arrowEnd = Vector2D.fromAngle(getAngle(targetVector, sourceVector), 44);
                    
                    iconsCtx.save();
                    iconsCtx.globalAlpha = 0.7;
                    iconsCtx.strokeStyle = iconsCtx.fillStyle = "red";
                    iconsCtx.lineWidth = 3;
                    privDrawArrow(sourceVector, targetVector, 3, 1, Math.PI / 8, 20);
                    //aircraft
                    
                    //iconsCtx.beginPath();
                    //iconsCtx.moveTo(sourceVector.x, sourceVector.y);
                    //iconsCtx.lineTo(targetVector.x, targetVector.y);
                    //iconsCtx.stroke();
                    iconsCtx.restore();
                }
            }
        },
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        hideAttacksFrom: function() {
            iconsCtx.putImageData(highlightRestoreData, 0, 0);
        }
    };
})();
