var searchPage = {
    run: function() {
        var canvas = document.getElementById("searchcanvas"),
            context = canvas.getContext("2d"),
            mapLeft = 5,
            divLeft = 974,
            imgDir = "content/images/search/",
            bgImg = imgDir + "bg-usn-search.jpg",
            flagImg = "content/images/usn-med.png",
            captionColor = "usnblue",
            game = player.Games[0],
            side = game.SideShortName,
            ships = [],
            searches = [],
            lastShipSelected = null,
            zoneSize = 36,
            mapMargin = 27,
            mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            selectedZone = "",
            selImg,
            mouseDown = false,
            dirty = false,
            dragThang = {
                dragging: false,
                origin: "",
                dragData: null,
                useSnapshot: false,
                snapshot: null,
                restoreFunction: null,
                drawFunction: null,
                useTopLeft: false
            };

        // Event handlers......................................................

        $("#return").on("click", function () {
            if (dirty) {
                showAlert("Home",
                    "Are you sure you want to return to the home page? Changes you've made will be lost.",
                    DLG_YESCANCEL, "blue", returnChoice);

                function returnChoice(choice) {
                    if (choice == "Yes") returnToHome();
                }
            } else {
                returnToHome();
            }
        });

        $("#done").on("click", function () {
            if (!allArrivalsOnMap()) {
                showAlert("End Phase", "All arriving ships must be brought on to the map.", DLG_OK, "red");
                return;
            }
            ajaxPostPhase(phasePosted);
            
            function phasePosted() {
                returnToHome();
            }
        });
        
        $("#airreadiness").on("click", function () {
            if (game.AircraftReadyState == 0)
                game.AircraftReadyState = 1;
            else if (game.AircraftReadyState == 1)
                game.AircraftReadyState = 0;
            else {
                showAlert("Air Readiness",
                    "Your aircraft are ready for operations. Are you sure you want to move them down to the hangar deck?",
                    DLG_YESCANCEL, "blue", readyChoice);

                function readyChoice(choice) {
                    if (choice == "Yes")
                        game.AircraftReadyState = 0;
                }
            }

            showAirReadiness();
            dirty = true;
        });
        
        $(".tablistitem").on("click", function (e) {
            workTabs(e);
        });

        $(document).on("mouseup", function (e) {
            documentMouseUp(e);
        });

        $(canvas).on("mousedown", function (e) {
            canvasMouseDown(e);
        }).on("click", function (e) {
            selectZone(windowToCanvas(canvas, e.clientX, e.clientY));
        }).on("dblclick", function (e) {
            if (shipsInZone(null, windowToCanvas(canvas, e.clientX, e.clientY))) {
                $("#zone").find("div.shipitem").addClass("selected");
            }
        });
        
        // Event handlers for dynamically-loaded ship lists
        $(document).on("click", ".shipitem", function (e) {
            doShipSelection(this, (e.shiftKey));
        }).on("mousedown", ".shipitem", function (e) {
            shipitemMouseDown(e);
        });

        // Functions...........................................................

        /*-------------------------------------------------------------------*/
        /* Reload player data w/ shallow games and return to home screen.    */
        /*-------------------------------------------------------------------*/
        function returnToHome() {
            ajaxGetPlayer(player.PlayerId, gotPlayer);

            function gotPlayer() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                scenes["home"]();
            }
        }
        /*-------------------------------------------------------------------*/
        /* Draw the search map semi-transparently and size the canvas to     */
        /* match its dimensions. Draw fleet markers and sighting markers on  */
        /* the map.                                                          */
        /*-------------------------------------------------------------------*/
        function drawMap(callback) {
            var img = new Image();

            img.src = imgDir + "searchboard.png";
            img.onload = function() {
                canvas.height = img.height;
                canvas.width = img.width;
                context.globalAlpha = 0.6;
                context.drawImage(img, 0, 0);
                context.globalAlpha = 1.0;
                
                if (callback) callback();
            };
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function drawShips() {
            var shipZones = [];
            
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].ShipType != "BAS") {
                    var thisLoc = ships[i].Location;
                    if (isNumber(thisLoc.substr(1, 1))) {
                        if ($.inArray(shipZones, thisLoc) == -1) {
                            drawShipsMarker(zoneToTopLeftCoords(thisLoc));
                            shipZones.push(thisLoc);
                        }
                    }
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function drawSearchMarkers() {
            for (var i = 0; i < searches.length; i++) {
                for (var j = 0; j < searches[i].Markers.length; j++) {
                    drawSightingMarker(searches[i].Markers[j]);
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /* Grab preloaded fleet image and draw it at the input canvas        */
        /* coordinates (NOT converted to top left).                          */
        /*-------------------------------------------------------------------*/
        function drawShipsMarker(coords) {
            var fleetImg = document.getElementById(side.toLowerCase() + "fleet");
            context.drawImage(fleetImg, coords.x - zoneSize, coords.y);
            
        }
        /*-------------------------------------------------------------------*/
        /* Grab preloaded sighting image and draw it at the input canvas     */
        /* coordinates.                                                      */
        /*-------------------------------------------------------------------*/
        function drawSightingMarker(marker) {
            var topLeft = zoneToTopLeftCoords(marker.Zone),
                sightingImg = document.getElementById(side.toLowerCase() + "sighting");
            context.drawImage(sightingImg, topLeft.x, topLeft.y);
        }
        /*-------------------------------------------------------------------*/
        /* Draw yellow square selected zone marker at the input canvas top   */
        /* and left coordinates.                                             */
        /*-------------------------------------------------------------------*/
        function drawZoneSelector(topLeft) {
            var top = topLeft.y,
                left = topLeft.x;
            
            selImg = context.getImageData(left, top, 43, 43);
            context.globalAlpha = 0.6;
            context.lineWidth = 4;
            context.strokeStyle = "#ffd651";
            context.beginPath();
            context.moveTo(left + 2, top + 2);
            context.lineTo(left + 40, top + 2);
            context.lineTo(left + 40, top + 40);
            context.lineTo(left + 2, top + 40);
            context.closePath();
            context.stroke();
        }
        /*-------------------------------------------------------------------*/
        /* Build up and return the HTML for a single ship list item.         */
        /*-------------------------------------------------------------------*/
        function getShipListItemHtml(ship) {
            var hitsDir = imgDir + "ships/hits/",
                idPrefix, shipId, imgSuffix, availHits, hits;
            
            if (ship.ShipType == "BAS") {
                shipId = "airbase-" + ship.AirbaseId;
                imgSuffix = ".png";
                availHits = ship.OriginalFortificationStrength;
                hits = ship.OriginalFortificationStrength - ship.FortificationStrength;
            } else {
                idPrefix = ship.Location == "ARR" ? "arrship-" : (ship.Location == "DUE" ? "dueship-" : "ship-");
                shipId = idPrefix + ship.ShipId;
                imgSuffix = "";
                availHits = ship.HitsToSink;
                hits = ship.Hits;
            }
            var html = "<li><div id=\"" + shipId + "\" class=\"noselect shipitem\"><img src=\"" +
                ship.SearchImgPath + imgSuffix + "\"  draggable=\"false\"/>";

            if (ship.ShipType == "CV" || ship.ShipType == "CVL" || ship.ShipType == "BAS") {
                html += "<div class=\"numplanes torpedo\">" + ship.TSquadrons +
                    "</div><div class=\"numplanes fighter\">" + ship.FSquadrons +
                    "</div><div class=\"numplanes divebomber\">" + ship.DSquadrons + "</div>";
            }
            html += "<div class=\"shiphits green\"><img src=\"" + hitsDir + availHits + "-hitsgreen.png\"></div>";
            
            if (hits > 0) {
                html += "<div class=\"shiphits red\"><img src=\"" + hitsDir + hits + "-hitsred.png\"></div></div></li>";
            }
            return html;
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function showAirReadiness() {
            var imgElement = document.getElementById("readinessimg");
            switch (game.AircraftReadyState) {
                case 0:
                    imgElement.src = imgDir + side.toLowerCase() + "-airnotready.png";
                    break;
                case 1:
                    imgElement.src = imgDir + side.toLowerCase() + "-airreadying.png";
                    break;
                case 2:
                    imgElement.src = imgDir + side.toLowerCase() + "-airready.png";
                    break;
            }
            if (game.PhaseId > 1)
                $(imgElement).addClass("disable");
            else
                $(imgElement).removeClass("disable");
        }
        /*-------------------------------------------------------------------*/
        /* 
        /*-------------------------------------------------------------------*/
        function documentMouseUp(e) {
            mouseDown = false;
            if (dragThang.dragging) {
                dragThang.dragging = false;
                canvas.removeEventListener("mousemove", canvasMouseMove, false);

                var coords = windowToCanvas(canvas, e.clientX, e.clientY);
                if (isLegitDrop(coords)) {
                    var zone = coordsToZone(coords),
                        cost = 0;

                    if (isNumber(dragThang.origin.substr(1, 1)))
                        cost = zoneDistance(dragThang.origin, zone);

                    relocateShips(zone, dragThang.dragData, cost);

                    if (dragThang.origin == "arrivals") {
                        $("#arrivals").find("div.shipitem").remove(".selected").parent();
                        selectZone(coords);
                        if ($("#arrivals").find("div.shipitem").length == 0) {
                            $("#zonetab").trigger("click");
                        }
                    } else if (isNumber(dragThang.origin.substr(1, 1))) {
                        sailShips(dragThang.origin, zone);
                    }
                    dirty = true;
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getSelectedShips(tabId) {
            var selShips = [],
                $list = $("#" + tabId).find("div.shipitem.selected"),
                id;

            for (var i = 0; i < $list.length; i++) {
                if ($list[i].id.indexOf("airbase-") == -1) {
                    id = $list[i].id.substr($list[i].id.indexOf("-") + 1);
                    selShips.push(getShipById(id));
                }
            }
            return selShips;
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getShipById(id) {
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].ShipId == id) {
                    return ships[i];
                }
            }
            return null;
        }
        /*-------------------------------------------------------------------*/
        /* Display on the Zone tab any ships in the currently selected zone. */
        /*-------------------------------------------------------------------*/
        function showShipsInZone() {
            if (!selectedZone) return;
            
            var html = "<div style=\"margin: 5px;\">" + selectedZone + "</div><ul>";
            
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == selectedZone) {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#zone").html(html + "<ul>");
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function showShipsDue() {
            var arrivalTurn = 0,
                html = "<ul>";
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "DUE") {
                    if (ships[i].ArrivalTurn != arrivalTurn) {
                        arrivalTurn = ships[i].ArrivalTurn;
                        var dueDate = militaryDateTimeStr(gameTimeFromTurn(ships[i].ArrivalTurn), false);
                        var turns = arrivalTurn - game.Turn;
                        html += "</ul><div style=\"margin: 5px; background-color: #516580; padding: 4px;\">Due " +
                            dueDate + " (" + turns + " turns)</div><ul>";
                    }
                    html += getShipListItemHtml(ships[i]);
                }
            }
            if (arrivalTurn == 0) // no ships due
                html = "<div style=\"margin: 5px;\">No future arrivals</div>";
            else
                html += "</ul>";
            
            $("#due").html(html);
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function showOffMapShips() {
            var html = "<ul>";
            
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "OFF" || ships[i].Location == "SNK") {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#off").html(html + "</ul>");
        }
        /*-------------------------------------------------------------------*/
        /* Return true if the zone containing the input coordinates also     */
        /* constains ships; false if not. Airbases are not counted.          */
        /*-------------------------------------------------------------------*/
        function shipsInZone(zone, coords, ours) {
            if (zone == null)
                zone = coordsToZone(coords);

            if (ours == null) ours = true;
            
            if (ours) {
                for (var i = 0; i < ships.length; i++) {
                    if (ships[i].Location == zone && ships.ShipType != "BAS")
                        return true;
                }
            }
            return false;
        }
        /*-------------------------------------------------------------------*/
        /* Respond to a click or Shift-click on a ship list item. Click      */
        /* toggles selected state; Shift-click selects or deselects a range. */
        /*-------------------------------------------------------------------*/
        function doShipSelection(shipItem, shiftPressed) {
            if (!lastShipSelected) {
                $(shipItem).addClass("selected");
                lastShipSelected = shipItem;
                return;
            }
            if (shiftPressed) {
                var start = $(".shipitem").index(shipItem);
                var end = $(".shipitem").index(lastShipSelected);

                if ($(lastShipSelected).hasClass("selected")) {
                    $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).addClass("selected");
                } else {
                    $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).removeClass("selected");
                }
            } else {
                if ($(shipItem).hasClass("selected"))
                    $(shipItem).removeClass("selected");
                else
                    $(shipItem).addClass("selected");
            }
            lastShipSelected = shipItem;
        }
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to the name of the search map    */
        /* zone that contains them.                                          */
        /*-------------------------------------------------------------------*/
        function coordsToZone(coords) {
            var x = coords.x;
            var y = coords.y;
            
            if (x < 28 || x > 962 || y < 28 || y > 746)
                return "";

            var zoneRow = (y - mapMargin) / zoneSize;
            var row = Math.floor(zoneRow / 3 + 1).toString();
            var areaRow = Math.floor(zoneRow % 3 + 1);
            
            var zoneCol = (x - mapMargin) / zoneSize;
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
        }
        /*-------------------------------------------------------------------*/
        /* Convert a zone name to its top left canvas coordinates.           */
        /*-------------------------------------------------------------------*/
        function zoneToTopLeftCoords(zone) {
            var col = 0;
            var areaSize = zoneSize * 3;
            for (var i = 0; i < mapCols.length; i++) {
                if (zone.charAt(0) == mapCols[i]) {
                    col = (i * areaSize) + mapMargin;
                    break;
                }
            }
            var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + mapMargin;

            switch(zone.substr(2, 1)) {
                case "B":
                    col += zoneSize;
                    break;
                case "C":
                    col += zoneSize * 2;
                    break;
                case "D":
                    row += zoneSize;
                    break;
                case "E":
                    row += zoneSize;
                    col += zoneSize;
                    break;
                case "F":
                    row += zoneSize;
                    col += zoneSize * 2;
                    break;
                case "G":
                    row += zoneSize * 2;
                    break;
                case "H":
                    row += zoneSize * 2;
                    col += zoneSize;
                    break;
                case "I":
                    row += zoneSize * 2;
                    col += zoneSize * 2;
                    break;
            }
            return { x: col, y: row };
        }
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to those of the top left of the  */
        /* zone that contains them.                                          */
        /*-------------------------------------------------------------------*/
        function coordsToTopLeftCoords(coords) {
            var zonesX = coords.x - mapMargin < 0 ? 0 : Math.floor((coords.x - mapMargin) / zoneSize),
                zonesY = coords.y - mapMargin < 0 ? 0 : Math.floor((coords.y - mapMargin) / zoneSize);
            return { x: (zonesX * zoneSize) + mapMargin, y: (zonesY * zoneSize) + mapMargin };
        }
        /*-------------------------------------------------------------------*/
        /* Calculate and return the distance, in zones, between two zones.   */
        /*-------------------------------------------------------------------*/
        function zoneDistance (zone1, zone2) {
            var zone1Coords = zoneToTopLeftCoords(zone1),
                zone2Coords = zoneToTopLeftCoords(zone2),
                zone1Adj = {
                    x: zone1Coords.x - mapMargin < 0 ? 0 : zone1Coords.x - mapMargin,
                    y: zone1Coords.y - mapMargin < 0 ? 0 : zone1Coords.y - mapMargin
                },
                zone2Adj = {
                    x: zone2Coords.x - mapMargin < 0 ? 0 : zone2Coords.x - mapMargin,
                    y: zone2Coords.y - mapMargin < 0 ? 0 : zone2Coords.y - mapMargin
                },
                zonesX = Math.floor(Math.abs(zone1Adj.x - zone2Adj.x) / zoneSize),
                zonesY = Math.floor(Math.abs(zone1Adj.y - zone2Adj.y) / zoneSize);
            return Math.max(zonesX, zonesY);
        }
        /*-------------------------------------------------------------------*/
        /* Mark the zone containing the input coordinates as the "current"   */
        /* zone. If it contains ships, display them on the Zone tab.         */
        /*-------------------------------------------------------------------*/
        function selectZone(coords) {
            var topLeft = coordsToTopLeftCoords(coords);
            topLeft.x -= 3;
            topLeft.y -= 3;
            
            if (selectedZone) {
                var oldTopLeft = zoneToTopLeftCoords(selectedZone),
                    oldTop = oldTopLeft.y - 3,
                    oldLeft = oldTopLeft.x - 3;
                context.putImageData(selImg, oldLeft, oldTop);
            }
            drawZoneSelector(topLeft);
            selectedZone = coordsToZone(coords);
            showShipsInZone();
        }
        /*-------------------------------------------------------------------*/
        /* Draw movement direction band and destination zone indicator       */
        /* during ship movement dragging.                                    */
        /*-------------------------------------------------------------------*/
        function drawMoveBand(coords) {
            var start = zoneToTopLeftCoords(dragThang.origin),
                topLeft = coordsToTopLeftCoords(coords);
            start.x += Math.floor(zoneSize / 2);
            start.y += Math.floor(zoneSize / 2);

            context.lineWidth = 2;
            context.lineCap = "round";
            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(coords.x, coords.y);
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(topLeft.x + zoneSize, topLeft.y);
            context.lineTo(topLeft.x + zoneSize, topLeft.y + zoneSize);
            context.lineTo(topLeft.x, topLeft.y + zoneSize);
            context.closePath();
            context.stroke();
        }
        /*-------------------------------------------------------------------*/
        /* Move fleet marker to a new location on the map.                   */
        /*-------------------------------------------------------------------*/
        function sailShips(startZone, endZone) {
            var startVector = zoneToTopLeftCoords(startZone),
                endVector = zoneToTopLeftCoords(endZone),
                distX = endVector.x - startVector.x,
                distY = endVector.y - startVector.y,
                startTime = new Date().getTime(),
                elapsed = 0,
                duration = 1000, // animate for one second
                handle,
                mapImg;

            drawMap(function() {
                drawSearchMarkers();
                //draw SOME ships
                mapImg = context.getImageData(0, 0, canvas.width, canvas.height);
                shipsAnim();
            });
            
            function shipsAnim() {
                handle = window.requestAnimationFrame(shipsAnim);
                elapsed = new Date().getTime() - startTime;

                if (elapsed >= duration) {
                    window.cancelAnimationFrame(handle);
                    drawMap(function() {
                        drawSearchMarkers();
                        drawShips();
                        drawZoneSelector(addVectors(zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 }));
                    });
                } else {
                    context.putImageData(mapImg, 0, 0);
                    var thisX = startVector.x + ((elapsed / duration) * distX);
                    var thisY = startVector.y + ((elapsed / duration) * distY);
                    drawShipsMarker({ x: thisX, y: thisY });
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /* Display on the Arrived tab any ships that arrived this turn.      */
        /*-------------------------------------------------------------------*/
        function showArrivingShips() {
            var html = "<ul>";
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR") {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#arrivals").html(html + "</ul>");
        }
        /*-------------------------------------------------------------------*/
        /* Return true if all of this turn's arrivals have been brought on   */
        /* to the map.                                                       */
        /*-------------------------------------------------------------------*/
        function allArrivalsOnMap() {
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR")
                    return false;
            }
            return true;
        }
        /*-------------------------------------------------------------------*/
        /* Find and return the minimum available movement points among ships */
        /* in the input zone.
        /*-------------------------------------------------------------------*/
        function getShipsMinMovePoints(zone) {
            var min = 999;
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == zone && ships[i].ShipType != "BAS") {
                    if (ships[i].MovePoints < min) min = ships[i].MovePoints;
                }
            }
            return min == 999 ? 0 : min;
        }

        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function relocateShips(zone, movedShips, cost) {
            for (var i = 0; i < movedShips.length; i++) {
                movedShips[i].MovePoints -= cost;
                movedShips[i].Location = zone;
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function shipitemMouseDown(e) {
            if (!$("#arrivals").hasClass("tabshown")) return;

            mouseDown = true;
            var selShips = getSelectedShips("arrivals");
            if (selShips.length > 0) {
                dragThang.dragging = false;
                dragThang.origin = "arrivals";
                dragThang.dragData = selShips;
                dragThang.useSnapshot = true;
                dragThang.snapshot = null;
                dragThang.restoreFunction = null;
                dragThang.drawFunction = drawShipsMarker;
                dragThang.useTopLeft = true;

                setTimeout(beginShipsDrag, 150);
            }
            e.preventDefault();
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseDown(e) {
            mouseDown = true;
            var zone = coordsToZone(windowToCanvas(canvas, e.clientX, e.clientY)),
                selShips = getSelectedShips("zone");

            if (selShips.length > 0) {
                dragThang.dragging = false;
                dragThang.origin = zone;
                dragThang.dragData = selShips;
                dragThang.useSnapshot = true;
                dragThang.snapshot = null;
                dragThang.restoreFunction = null;
                dragThang.drawFunction = drawMoveBand;
                dragThang.useTopLeft = false;
                
                setTimeout(beginShipsDrag, 150);
            }
            e.preventDefault();
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function beginShipsDrag() {
            if (mouseDown) {
                dragThang.dragging = true;
                canvas.addEventListener("mousemove", canvasMouseMove, false);
            }
        }
        /*-------------------------------------------------------------------*/
        /* Respond to mouse movement during drag. If drag is just starting,  */
        /* capture canvas image, otherwise restore canvas image captured at  */
        /* start of drag. Draw element being dragged at new mouse coordinates.*/
        /*-------------------------------------------------------------------*/
        function canvasMouseMove(e) {
            // see if we've gone off the reservation -- if so, cancel the drag
            if (e.clientX < canvas.left || e.clientX > canvas.left + canvas.width ||
                e.clientY < canvas.top || e.clientY > canvas.top + canvas.height) {

                mouseDown = false;
                if (dragThang.dragging) {
                    dragThang.dragging = false;
                    canvas.removeEventListener("mousemmove", canvasMouseMove);
                }
                return;
            }

            if (dragThang.dragging) {
                var canvasCoords = windowToCanvas(canvas, e.clientX, e.clientY);
                if (dragThang.useSnapshot) {
                    if (dragThang.snapshot) {
                        context.putImageData(dragThang.snapshot, 0, 0);
                    } else {
                        dragThang.snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
                    }
                } else if (dragThang.restoreFunction) {
                    dragThang.restoreFunction();
                }

                if (isLegitDrop(canvasCoords)) {
                    if (dragThang.useTopLeft) {
                        var topLeft = coordsToTopLeftCoords(canvasCoords);
                        dragThang.drawFunction(topLeft);
                    } else
                        dragThang.drawFunction(canvasCoords);
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function isLegitDrop(coords) {
            var dropZone = coordsToZone(coords);
            if (dropZone == dragThang.origin) return true;

            if (dragThang.origin == "arrivals") {
                if (side == "USN") {
                    if (dropZone.substr(0, 1) == "I" && "BEH".indexOf(dropZone.substr(2, 1)) != -1)
                        return true;
                } else {
                    if (dropZone.substr(0, 1) == "A" && "ADG".indexOf(dropZone.substr(2, 1)) != -1)
                        return true;
                }
            } else if (isNumber(dragThang.origin.substr(1, 1))) {
                var zones = zoneDistance(dragThang.origin, dropZone),
                    moves = getShipsMinMovePoints(dragThang.origin);
                if (zones <= moves) return true;
            }
            return false;
        }
        /*-------------------------------------------------------------------*/
        /* Make ajax call to load player's ships in this game.               */
        /*-------------------------------------------------------------------*/
        function ajaxLoadShips(successCallback) {
            $.ajax({
                url: "api/ship",
                type: "GET",
                data: { playerId: player.PlayerId, gameId: game.GameId },
                accepts: "application/json",
                success: function (data) {
                    ships = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
        }
        /*-------------------------------------------------------------------*/
        /* Make ajax call to post phase data back to the server.             */
        /*-------------------------------------------------------------------*/
        function ajaxPostPhase(successCallback) {

        }
        /*-------------------------------------------------------------------*/
        /* Make ajax call to load player's search markers in this game.      */
        /*-------------------------------------------------------------------*/
        function ajaxLoadSearches(successCallback) {
            $.ajax({
                url: "api/search",
                type: "GET",
                data: { gameId: game.GameId, playerId: player.PlayerId },
                accepts: "application/json",
                success: function (data) {
                    searches = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
        }
        /*-------------------------------------------------------------------*/
        /* Callback for ajaxLoadShips call. Set up the various ships display */
        /* elements, draw the search map.                                    */
        /*-------------------------------------------------------------------*/
        function gotShips() {
            $("#searchcanvas").css("left", mapLeft + "px");
            $("#searchdiv").css("left", divLeft + "px").draggable({
                handle: ".floathead",
                containment: "#pagediv",
                scroll: false
            });
            $("#return").css("left", "1330px");

            var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
                " " + game.PhaseName + " Phase vs. " + game.OpponentNickname + "</span>";
            $("#gamedesc").addClass(captionColor).html("MIDWAY SEARCH <img src=\"" + flagImg + "\" />" + gameStatus);

            $("#pagediv").css("background-image", "url(\"" + bgImg + "\")");

            if (game.PhaseId == 1 && game.AircraftReadyState == 1)
                game.AircraftReadyState = 2;

            showAirReadiness();

            ajaxLoadSearches(gotSearches);
            function gotSearches() {
                drawMap();

                if (game.PhaseId == 1) {
                    $("#arrivalstab").css("display", "inline-block").addClass("tabshown");
                    $("#arrivals").addClass("tabshown");
                    showArrivingShips();
                } else {
                    $("#arrivalstab").css("display", "none");
                    $("#zone, #zonetab").addClass("tabshown");
                }

                drawShips();
                drawSearchMarkers();
                
                if (selectedZone) {
                    var coords = zoneToTopLeftCoords(selectedZone);
                    coords.y -= 3;
                    coords.x =- 3;
                    
                    drawZoneSelector(coords);
                }
            
                showShipsInZone(selectedZone);
                showShipsDue();
                showOffMapShips();
            }
        }
        // Initialize..........................................................
        
        if (side == "IJN") {
            mapLeft = 418;
            divLeft = 5;
            bgImg = imgDir + "bg-ijn-search.jpg";
            flagImg = "content/images/ijn-med.png";
            captionColor = "ijnred";
        }

        selectedZone = game.SelectedZone;
        ajaxLoadShips(gotShips);
    }
};