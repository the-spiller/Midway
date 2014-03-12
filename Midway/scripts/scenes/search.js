var searchPage = {
    run: function () {
        var canvas = document.getElementById("searchcanvas"),
            context = canvas.getContext("2d"),
            mapLeft = 5,
            divLeft = 974,
            imgDir = "content/images/search/",
            bgImg = imgDir + "bg-search.jpg",
            flagImg = "content/images/usn-med.png",
            captionColor = "usnblue",
            game = player.Games[0],
            side = game.SideShortName,
            phase = { },
            ships = [],
            shipZones = [],
            searches = [],
            lastShipSelected = null,
            selectedZone = "",
            selectedArea,
            selImg,
            mouseDown = false,
            dirty = false,
            dragThang = {
                dragging: false,
                origin: "",
                dragData: null,
                cursorImg: null,
                cursorOffset: { x: 0, y: 0 },
                useSnapshot: false,
                snapshot: null,
                restoreFunction: null,
                drawFunction: null,
                useTopLeft: false
            },
            grid = new SearchGrid();

        // Event handlers......................................................

        $("#return").on("click", function () {
            if (dirty) {
                showAlert("Home",
                    "Are you sure you want to return to the home page without posting? Changes you've made will be lost.",
                    DLG_YESCANCEL, "blue", returnChoice);

                function returnChoice(choice) {
                    if (choice == "Yes") returnToHome();
                }
            } else {
                returnToHome();
            }
        });
        $("#done").on("click", function () {
            if (!$(this).hasClass("disable")) {
                if (!allArrivalsOnMap()) {
                    showAlert("End Phase", "All arriving ships must be brought on to the map.", DLG_OK, "red");
                    return;
                }
                ajaxPutPhase(function() {
                    returnToHome();
                });
            }
        });
        if (game.PhaseId == 1) {
            $("#airreadiness").on("click", function() {
                if (game.AircraftReadyState == 0)
                    game.AircraftReadyState = 1;
                else if (game.AircraftReadyState == 1)
                    game.AircraftReadyState = 0;
                else {
                    showAlert("Air Readiness",
                        "Your aircraft are ready for operations. Are you sure you want to move them down to the hangar deck?",
                        DLG_YESCANCEL, "blue", function(choice) {
                            if (choice == "Yes")
                                game.AircraftReadyState = 0;
                        });
                }
                showAirReadiness();
                dirty = true;
            });
        }
        $(document).on("mouseup", function () {
            dragThang.dragging = false;
        });
        $(canvas).on("mousedown", function(e) {
            canvasMouseDown(e);
        }).on("mouseup", function(e) {
            canvasMouseUp(e);
        }).on("click", function (e) {
            selectZone(windowToCanvas(canvas, e.clientX, e.clientY));
        }).on("dblclick", function (e) {
            var coords = windowToCanvas(canvas, e.clientX, e.clientY),
                zone = grid.coordsToZone(coords);
            if ($.inArray(zone, shipZones) != -1) {
                $("#zone").find("div.shipitem").addClass("selected");
            }
        });
        // Event handlers for dynamically-loaded elements
        $(document).on("click", ".tablistitem", function (e) {
            workTabs(e);
        });
        $(document).on("click", ".shipitem", function (e) {
            doShipSelection(this, (e.shiftKey));
        }).on("mousedown", ".shipitem", function (e) {
            controlItemMouseDown(e);
        }).on("mousedown", ".searchitem", function(e) {
            controlItemMouseDown(e);
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
        /* match its dimensions. Add the atolls Kure and Midway with no      */
        /* transparency.
        /*-------------------------------------------------------------------*/
        function drawMap(callback) {
            var mapImg = new Image(),
                atollsImg = new Image();

            mapImg.src = imgDir + "searchboard.png";
            mapImg.onload = function () {
                canvas.height = mapImg.height;
                canvas.width = mapImg.width;
                context.save();
                context.globalAlpha = 0.4;
                context.drawImage(mapImg, 0, 0);
                context.restore();

                atollsImg.src = imgDir + "atolls.png";
                atollsImg.onload = function () {
                    context.drawImage(atollsImg, 711, 495);
                    if (callback) callback();
                };
            };
        }
        /*-------------------------------------------------------------------*/
        /* Walk the array of sighting markers and draw each one.             */
        /*-------------------------------------------------------------------*/
        function drawSightings() {
            for (var i = 0; i < searches.length; i++) {
                for (var j = 0; j < searches[i].Markers.length; j++) {
                    drawSightingMarker(searches[i].Markers[j].Zone);
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /* Grab preloaded sighting image and draw it at the input marker's   */
        /* canvas coordinates.                                               */
        /*-------------------------------------------------------------------*/
        function drawSightingMarker(zone) {
            var topLeft = grid.zoneToTopLeftCoords(zone),
                sightingImg = document.getElementById("sighting");
            context.drawImage(sightingImg, topLeft.x, topLeft.y);
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function highlightArrivalZones() {
            var topZone = side == "IJN" ? "A1A" : "I1B",
                bottomZone = side == "IJN" ? "A7D" : "I7E",
                topCoords = grid.zoneToTopLeftCoords(topZone),
                bottomCoords = addVectors(grid.zoneToTopLeftCoords(bottomZone), { x: grid.zoneSize, y: grid.zoneSize }),
                width = bottomCoords.x - topCoords.x,
                height = bottomCoords.y - topCoords.y;

            selImg = context.getImageData(topCoords.x, topCoords.y, width, height);
            context.save();
            context.globalAlpha = 0.2;
            context.fillStyle = "#ffd651";
            context.rect(topCoords.x, topCoords.y, width, height);
            context.fill();
            context.restore();
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function removeArrivalZoneHighlight() {
            var topCoords = grid.zoneToTopLeftCoords(side == "IJN" ? "A1A" : "I1B");
            context.putImageData(selImg, topCoords.x, topCoords.y);
        }
        /*-------------------------------------------------------------------*/
        /* Walk the ships array and draw a fleet marker at each              */
        /* ship.Location found, reloading the shipZones array as we go. If   */
        /* the excludedZones array is populated, don't draw a marker at      */
        /* the locations it contains.                                        */
        /*-------------------------------------------------------------------*/
        function drawShips(excludedZones) {
            if (excludedZones == null) excludedZones = [];
            loadShipZones();
            for (var i = 0; i < shipZones.length; i++) {
                if ($.inArray(shipZones[i], excludedZones) == -1)
                    drawShipsMarker(grid.zoneToTopLeftCoords(shipZones[i]));
            }
        }
        /*-------------------------------------------------------------------*/
        /* Grab preloaded fleet image and draw it at the input canvas        */
        /* coordinates (NOT converted to top left).                          */
        /*-------------------------------------------------------------------*/
        function drawShipsMarker(coords) {
            var fleetImg = document.getElementById("fleet");
            context.drawImage(fleetImg, coords.x - grid.zoneSize, coords.y);
        }
        /*-------------------------------------------------------------------*/
        /* Mark the zone containing the input coordinates as the "current"   */
        /* zone. If it contains ships, display them on the Zone tab.         */
        /*-------------------------------------------------------------------*/
        function selectZone(coords) {
            var topLeft = addVectors(grid.coordsToTopLeftCoords(coords), { x: -3, y: -3 });
            if (selectedZone) {
                var oldTopLeft = grid.zoneToTopLeftCoords(selectedZone),
                    oldTop = oldTopLeft.y - 3,
                    oldLeft = oldTopLeft.x - 3;
                context.putImageData(selImg, oldLeft, oldTop);
            }
            drawSelector(topLeft, 1);
            selectedZone = grid.coordsToZone(coords);
            showShipsInZone();
        }
        /*-------------------------------------------------------------------*/
        /* Mark the area containing the input coordinates as the "current"   */
        /* area.                                                             */
        /*-------------------------------------------------------------------*/
        function selectArea(coords) {
            var zone = grid.coordsToZone(coords);
            if (zone) {
                var area = zone.substr(0, 2);
                var topLeftCoords = addVectors(grid.zoneToTopLeftCoords(area + "A"), { x: -3, y: -3 });
                drawSelector(topLeftCoords, 3);
                selectedArea = area;
            }
        }
        /*-------------------------------------------------------------------*/
        /* Draw yellow square selected area/zone marker at the input canvas  */
        /* top and left coordinates.                                         */
        /*-------------------------------------------------------------------*/
        function drawSelector(topLeft, sizeInZones) {
            var top = topLeft.y,
                left = topLeft.x;

            var sideLength = (sizeInZones * 36) + 5;
            if (sizeInZones == 1)
                // area-sized selections are restored w/ search cursor, so we only need zone
                selImg = context.getImageData(left, top, sideLength + 3, sideLength + 3);
            context.save();
            context.globalAlpha = 0.6;
            context.lineWidth = 4;
            context.strokeStyle = "#ffd651";
            context.beginPath();
            context.moveTo(left + 2, top + 2);
            context.lineTo(left + sideLength, top + 2);
            context.lineTo(left + sideLength, top + sideLength);
            context.lineTo(left + 2, top + sideLength);
            context.closePath();
            context.stroke();
            context.restore();
        }
        /*-------------------------------------------------------------------*/
        /* Draw movement direction band and destination zone indicator       */
        /* during ship movement dragging.                                    */
        /*-------------------------------------------------------------------*/
        function drawMoveBand(coords) {
            var start = grid.zoneToTopLeftCoords(dragThang.origin),
                topLeft = grid.coordsToTopLeftCoords(coords);
            start.x += Math.floor(grid.zoneSize / 2);
            start.y += Math.floor(grid.zoneSize / 2);

            context.lineWidth = 2;
            context.lineCap = "round";
            context.strokeStyle = "#ff0000";
            context.beginPath();
            context.moveTo(start.x, start.y);
            context.lineTo(coords.x, coords.y);
            context.moveTo(topLeft.x, topLeft.y);
            context.lineTo(topLeft.x + grid.zoneSize, topLeft.y);
            context.lineTo(topLeft.x + grid.zoneSize, topLeft.y + grid.zoneSize);
            context.lineTo(topLeft.x, topLeft.y + grid.zoneSize);
            context.closePath();
            context.stroke();
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function drawCursorImg(x, y) {
            if (dragThang.snapshot) {
                context.putImageData(dragThang.snapshot, 0, 0);
            }
            dragThang.snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
            context.drawImage(dragThang.cursorImg, x, y);
        }
        /*-------------------------------------------------------------------*/
        /* Display on the Zone tab any ships in the currently selected zone. */
        /*-------------------------------------------------------------------*/
        function showShipsInZone() {
            if (!selectedZone) return;

            var zone = selectedZone;
            if (zone == "H5G") zone = "Midway";
            var html = "<div style=\"margin: 5px;\">" + zone + "</div>", i;
            if (shipZones.length == 0) loadShipZones();
            
            // sightings
            for (i = 0; i < searches.length; i++) {
                if (searches[i].Area == selectedZone.substr(0, 2) && searches[i].Markers.length) {
                    for (var j = 0; j < searches[i].Markers.length; j++) {
                        if (searches[i].Markers[j].Zone == selectedZone) {
                            html += getSightedShipsHtml(searches[i]);
                        }
                    }
                }
            }
            // own ships
            html += "<ul>";
            if ($.inArray(selectedZone, shipZones) != -1) {
                for (i = 0; i < ships.length; i++) {
                    if (ships[i].Location == selectedZone) {
                        html += getShipListItemHtml(ships[i]);
                    }
                }
            }
            // airbases
            for (i = 0; i < ships.length; i++) {
                if (ships[i].Location == selectedZone && ships[i].ShipType == "BAS") {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#zone").html(html + "</ul>");
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function loadShipZones() {
            shipZones.length = 0;
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].ShipType != "BAS" && isNumber(ships[i].Location.substr(1, 1))) {
                    if ($.inArray(ships[i].Location, shipZones) == -1) {
                        shipZones.push(ships[i].Location);
                    }
                }
            }
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
                        var dueDate = militaryDateTimeStr(gameTimeFromTurn(arrivalTurn), false);
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
            var html = "<ul>",
                gotOne = false;

            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "OFF" || ships[i].Location == "SNK") {
                    html += getShipListItemHtml(ships[i]);
                    gotOne = true;
                }
            }
            if (!gotOne)    // no ships off map
                html = "<div style=\"margin: 5px;\">No ships off map</div>";
            else
                html += "</ul>";

            $("#off").html(html);
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
        /* Build up and return the HTML for all sighted ship types in a zone.*/
        /*-------------------------------------------------------------------*/
        function getSightedShipsHtml(search) {
            var html = "",
                otherside = side == "USN" ? "ijn" : "usn";
            for (var i = 0; i < search.Markers.length; i++) {
                if (search.Markers[i].Zone == selectedZone) {
                    var turns = game.Turn - search.Turn;
                    var found = turns == 0 ? " this turn:" : turns == 1 ? " a turn ago:" : turns + " turns ago:";
                    html += "<table class=\"noselect\"><tr><td colspan=\"2\">Ship types sighted " + found + "</td></tr>";
                    var types = search.Markers[i].TypesFound.split(",");
                    for (var j = 0; j < types.length; j++) {
                        html += "<tr><td class=\"sightedlabel\">" + types[j] + "</td><td class=\"sightedship\">" +
                            "<img src=\"" + imgDir + otherside + types[j] + ".png\" /></td></tr>";
                    }
                    html += "</table>";
                }
            }
            return html;
        }
        /*-------------------------------------------------------------------*/
        /* Display image indicating air readiness.                           */
        /*-------------------------------------------------------------------*/
        function showAirReadiness() {
            var imgElement = document.getElementById("readinessimg"), readyDesc;
            switch (game.AircraftReadyState) {
                case 0:
                    imgElement.src = imgDir + side.toLowerCase() + "-airnotready.png";
                    readyDesc = "not ready";
                    break;
                case 1:
                    imgElement.src = imgDir + side.toLowerCase() + "-airreadying.png";
                    readyDesc = "readying";
                    break;
                default:
                    imgElement.src = imgDir + side.toLowerCase() + "-airready.png";
                    readyDesc = "ready";
                    break;
            }
            if (game.PhaseId > 1)
                $("#airreadiness").prop("title", "Aircraft " + readyDesc).addClass("disable");
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getSearch(searchItem) {
            if (!searchItem) return null;
            var searchNum = Number(searchItem.id.substr(searchItem.id.indexOf("-") + 1));
            for (var i = 0; i < searches.length; i++) {
                if (searches[i].Turn == game.Turn && searches[i].SearchNumber == searchNum)
                    return searches[i];
            }
            return null;
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
        /* Move fleet marker to a new location on the map.                   */
        /*-------------------------------------------------------------------*/
        function sailShips(startZone, endZone) {
            var startPos = grid.zoneToTopLeftCoords(startZone),
                endPos = grid.zoneToTopLeftCoords(endZone),
                distX = endPos.x - startPos.x,
                distY = endPos.y - startPos.y,
                startTime = new Date().getTime(),
                elapsed = 0,
                duration = 1000, // animate for one second
                handle,
                mapImg;

            drawMap(function() {
                drawSightings();
                drawShips([startZone, endZone]);
                mapImg = context.getImageData(0, 0, canvas.width, canvas.height);
                shipsAnim();
            });
            
            function shipsAnim() {
                handle = window.requestAnimationFrame(shipsAnim);
                elapsed = new Date().getTime() - startTime;

                if (elapsed >= duration) {
                    window.cancelAnimationFrame(handle);
                    drawMap(function() {
                        drawSightings();
                        drawShips();
                        drawSelector(addVectors(grid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 }), 1);
                        showShipsInZone(selectedZone);
                    });
                } else {
                    var thisX = startPos.x + ((elapsed / duration) * distX);
                    var thisY = startPos.y + ((elapsed / duration) * distY);
                    context.putImageData(mapImg, 0, 0);
                    drawShipsMarker({ x: thisX, y: thisY });
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function controlItemMouseDown(e) {
            var panelId = $("#tabpanels").find("div.tabshown").attr("id");
            if (!panelId) return;

            dragThang.dragging = false;
            dragThang.origin = panelId;

            if (game.PhaseId == 1 && panelId == "arrivals") {
                var selShips = getSelectedShips("arrivals");
                if (selShips.length > 0) {
                    mouseDown = true;
                    dragThang.dragData = selShips;
                    dragThang.useSnapshot = true;
                    dragThang.cursorImg = null;
                    dragThang.snapshot = null;
                    dragThang.restoreFunction = null;
                    dragThang.drawFunction = drawShipsMarker;
                    dragThang.useTopLeft = true;
                    setTimeout(beginControlsDrag, 150);
                }
            } else if (game.PhaseId == 2 & panelId == "search") {
                var selSearch = getSearch(e.target);
                if (selSearch) {
                    mouseDown = true;
                    dragThang.dragData = selSearch;
                    dragThang.cursorImg = document.getElementById(selSearch.SearchType + "searchcursor");
                    dragThang.cursorOffset = { x: -40, y: -40 },
                    dragThang.useSnapshot = false;
                    dragThang.snapshot = null;
                    dragThang.restoreFunction = null;
                    dragThang.drawFunction = null;
                    selectedArea = "";
                    setTimeout(beginControlsDrag, 150);
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseDown(e) {
            if (game.PhaseId == 1) {
                mouseDown = true;
                var zone = grid.coordsToZone(windowToCanvas(canvas, e.clientX, e.clientY)),
                    selShips = getSelectedShips("zone");

                if (selShips.length > 0) {
                    dragThang.dragging = false;
                    dragThang.origin = zone;
                    dragThang.dragData = selShips;
                    dragThang.cursorImg = null;
                    dragThang.useSnapshot = true;
                    dragThang.snapshot = null;
                    dragThang.restoreFunction = null;
                    dragThang.drawFunction = drawMoveBand;
                    dragThang.useTopLeft = false;

                    setTimeout(beginControlsDrag, 150);
                }
                e.preventDefault();
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function beginControlsDrag() {
            if (mouseDown) {
                dragThang.dragging = true;
                if (dragThang.origin == "arrivals") highlightArrivalZones();
                canvas.addEventListener("mousemove", canvasMouseMove, false);
            }
        }
        /*-------------------------------------------------------------------*/
        /* Respond to mouse movement during drag. If drag is just starting,  */
        /* capture canvas image, otherwise restore canvas image captured at  */
        /* start of drag. Draw element being dragged at new mouse coordinates.*/
        /*-------------------------------------------------------------------*/
        function canvasMouseMove(e) {
            if (dragThang.dragging) {
                var canvasCoords = windowToCanvas(canvas, e.clientX, e.clientY);
                if (dragThang.origin == "search") {
                    showSearching(canvasCoords);
                } else {
                    if (dragThang.useSnapshot) {
                        if (dragThang.snapshot) {
                            context.putImageData(dragThang.snapshot, 0, 0);
                        } else {
                            dragThang.snapshot = context.getImageData(0, 0, canvas.width, canvas.height);
                        }
                    }
                    if (dragThang.restoreFunction) {
                        dragThang.restoreFunction();
                    }
                    if (isLegitDrop(canvasCoords)) {
                        if (dragThang.useTopLeft) {
                            var topLeft = grid.coordsToTopLeftCoords(canvasCoords);
                            dragThang.drawFunction(topLeft);
                        } else
                            dragThang.drawFunction(canvasCoords);
                    }
                }
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseUp(e) {
            mouseDown = false;
            if (dragThang.dragging) {
                dragThang.dragging = false;
                canvas.removeEventListener("mousemove", canvasMouseMove, false);
                if (dragThang.origin == "arrivals") removeArrivalZoneHighlight();
                
                var coords = windowToCanvas(canvas, e.clientX, e.clientY);
                    var zone = grid.coordsToZone(coords);

                    if (dragThang.origin == "search") {
                        hideSearching();
                        selectArea(coords);
                        executeSearch(coords, zone, dragThang.dragData, function() {
                            context.putImageData(dragThang.snapshot, 0, 0);
                            drawSightings();
                        });
                    } else {
                        if (isLegitDrop(coords)) {
                            var cost = 0;

                            if (isNumber(dragThang.origin.substr(1, 1)))
                                cost = grid.zoneDistance(dragThang.origin, zone);

                            relocateShips(zone, dragThang.dragData, cost);

                            if (dragThang.origin == "arrivals") {
                                dragThang.drawFunction(grid.coordsToTopLeftCoords(coords));
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
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function isLegitDrop(coords) {
            var dropZone = grid.coordsToZone(coords);
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
                var zones = grid.zoneDistance(dragThang.origin, dropZone),
                    moves = getShipsMinMovePoints(dragThang.origin);
                if (zones <= moves) return true;
            }
            return false;
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function withinRange(coords) {
            var zone = grid.coordsToZone(coords),
                i;
            
            if (!zone) return false;
            var area = zone.substr(0, 2);
            if (dragThang.dragData.SearchType == "air") {
                if (game.SearchRange == 0) return true;
                
                for (i = 0; i < shipZones.length; i++) {
                    if (grid.zoneDistance(area + "E", shipZones[i]) <= (game.SearchRange + 1))
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
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function showSearching(canvasCoords) {
            if (withinRange(canvasCoords)) {
                canvas.style.cursor = "none";
                var coords = addVectors(canvasCoords, dragThang.cursorOffset);
                drawCursorImg(coords.x, coords.y);
                selectArea(canvasCoords);
            } else {
                if (dragThang.snapshot) context.putImageData(dragThang.snapshot, 0, 0);
                canvas.style.cursor = "auto";
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function hideSearching() {
            canvas.style.cursor = "auto";
            if (dragThang.snapshot) {
                context.putImageData(dragThang.snapshot, 0, 0);
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function executeSearch(coords, zone, search, callback) {
            if (withinRange(coords)) {
                var area = zone.substr(0, 2);
                if (!alreadySearched(area)) {
                    search.Area = area;
                    ajaxPostSearch(search, function () {
                        $("#search-" + search.SearchNumber).remove().parent();
                        if (search.Markers && search.Markers.length) {
                            var msg = "Enemy ships sighted!";
                            for (var i = 0; i < search.Markers.length; i++) {
                                msg += "<p>" + search.Markers[i].Zone + ": " + search.Markers[i].TypesFound + "</p>";
                            }
                            showAlert("Search", msg, DLG_OK, "blue", callback);
                            
                        } else {
                            showAlert("Search", "No sightings.", DLG_OK, "blue", callback);
                        } 
                    });
                } else {
                    showAlert("Search", "You've already searched area " + area + "!", DLG_OK, "blue", callback);
                }
            } else {
                if (dragThang.snapshot) context.putImageData(dragThang.snapshot, 0, 0);
                canvas.style.cursor = "auto";
                if (callback) callback();
            }
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function alreadySearched(area) {
            for (var i = 0; i < searches.length; i++) {
                if (searches[i].Turn == game.Turn && searches[i].Area == area)
                    return true;
            }
            return false;
        }
        /*-------------------------------------------------------------------*/
        /* Mark ships data with a new location.                              */
        /*-------------------------------------------------------------------*/
        function relocateShips(zone, movedShips, cost) {
            for (var i = 0; i < movedShips.length; i++) {
                movedShips[i].MovePoints -= cost;
                movedShips[i].Location = zone;
            }
        }
        /*-------------------------------------------------------------------*/
        /* Display on the Arrived tab any ships that arrived this turn.      */
        /*-------------------------------------------------------------------*/
        function showArrivingShips() {
            if (game.PhaseId > 1) return;

            var html = "<ul>";
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR") {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#arrivals").html(html + "</ul>").addClass("tabshown");
            $("#arrivalstab").addClass("tabshown");
        }
        /*-------------------------------------------------------------------*/
        /* Return true if all of this turn's arrivals have been brought on   */
        /* to the map.                                                       */
        /*-------------------------------------------------------------------*/
        function allArrivalsOnMap() {
            if (game.PhaseId > 1) return true;

            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR")
                    return false;
            }
            return true;
        }
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function showSearchControls() {
            if (game.PhaseId != 2) return;
            
            var html = "<div style=\"margin: 5px 0 15px 5px;\">Available searches</div><ul>",
                searchDesc;

            for (var i = 0; i < searches.length; i++) {
                if (searches[i].Turn == game.Turn && !searches[i].Area) {
                    if (searches[i].SearchType == "sea") {
                        searchDesc = "Search any area containing one of your ships";
                    } else if (game.SearchRange == 0) {   //Unlimited
                        searchDesc = "Search any area";
                    } else {
                        searchDesc = "Search any area within " + game.SearchRange + " zones of any of your ships";
                    }
                    html += "<li><div id=\"search-" + searches[i].SearchNumber + "\" class=\"noselect searchitem\"" +
                        " title=\"" + searchDesc + "\">" +
                        "<img id=\"searchimg-" + searches[i].SearchNumber + "\" src=\"" + imgDir +
                        side.toLowerCase() + "-" + searches[i].SearchType + "-search.png\" draggable=\"false\" /></div></li>";
                }
            }
            $("#search").html(html + "<ul>");
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
        /* Make ajax call to load phase data in this game.                   */
        /*-------------------------------------------------------------------*/
        function ajaxLoadPhase(successCallback) {
            $.ajax({
                url: "api/phase/" + game.PhaseId,
                type: "GET",
                accepts: "application/json",
                success: function(data) {
                    phase = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
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
        /* Make ajax call to load player's search markers in this game.      */
        /*-------------------------------------------------------------------*/
        function ajaxLoadSearches(successCallback) {
            $.ajax({
                url: "api/search",
                type: "GET",
                data: { gameId: game.GameId, playerId: player.PlayerId },
                accepts: "application/json",
                success: function(data) {
                    searches = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
        }
        /*-------------------------------------------------------------------*/
        /* Make ajax call to post new search to the server and find out if   */
        /* it was successful.                                                */
        /*-------------------------------------------------------------------*/

        function ajaxPostSearch(search, successCallback) {
        $.ajax({
                url: "api/search",
                type: "POST",
                data: search,
                success: function (data) {
                    var retSearch = JSON.parse(data);
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
                error: function(xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
        }
        /*-------------------------------------------------------------------*/
        /* Make ajax call to post phase data back to the server.             */
        /*-------------------------------------------------------------------*/
        function ajaxPutPhase(successCallback) {
            // parse out future arrivals
            var shipsToPass = [];
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location != "DUE")
                    shipsToPass.push(ships[i]);
            }
            $.ajax({
                url: "api/phase",
                type: "PUT",
                data: {
                    GameId: game.GameId,
                    PlayerId: player.PlayerId,
                    SelectedZone: selectedZone,
                    AirReadiness: game.AircraftReadyState,
                    Points: game.Points,
                    Ships: shipsToPass,
                    Searches: searches
                },
                success: function() {
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    showAjaxError(xhr, status, errorThrown);
                }
            });
        }
        /*-------------------------------------------------------------------*/
        /* Callback for ajaxLoadPhase call. Set up tabs based on phase       */ 
        /* actions.                                                          */
        /*-------------------------------------------------------------------*/
        function setTabs() {
            var tabHtml = "", panelHtml = "", showFirst = " tabshown";
            for (var i = 0; i < phase.Actions.length; i++) {
                var act = phase.Actions[i];
                if (game.Waiting == "N" || act.AvailWhenWaiting == "Y") {
                    tabHtml += "<li id=\"" + act.ActionKey.toLowerCase() + "tab\" class=\"tablistitem" + showFirst + "\" title=\"" +
                        act.Description + "\">" + act.ActionKey + "</li>";
                    panelHtml += "<div id=\"" + act.ActionKey.toLowerCase() + "\" class=\"tabpanel" + showFirst + "\"></div>";
                    showFirst = "";
                }
            }
            $("#tabs").html(tabHtml);
            $("#tabpanels").html(panelHtml);
        }
        /*-------------------------------------------------------------------*/
        /* Callback for ajaxLoadShips call. Set up the various ships display */
        /* elements, draw the search map and markers.                        */
        /*-------------------------------------------------------------------*/
        function shipsLoaded() {
            $("#searchcanvas").css("left", mapLeft + "px");
            $("#searchdiv").css("left", divLeft + "px").draggable({
                handle: ".floathead",
                containment: "#pagediv",
                scroll: false
            });
            $("#return").css("left", "1330px");

            var wait = "";
            if (game.Waiting == "Y") {
                wait = " (waiting)";
                $("#done").addClass("disable");
            }

            var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
                " vs. " + (game.OpponentNickname || "?") +
                ": <span id=\"phase\" title=\"" + phase.Description + "\">" + phase.Name + " Phase</span>" + wait + "</span>";
            $("#gamedesc").addClass(captionColor).html("MIDWAY SEARCH <img src=\"" + flagImg + "\" />" + gameStatus);

            $("#pagediv").css({ "background-image": "url(\"" + bgImg + "\")", "background-repeat": "repeat" });

            if (game.PhaseId == 1 && game.AircraftReadyState == 1)
                game.AircraftReadyState = 2;
            showAirReadiness();
            
            ajaxLoadSearches(function () {
                drawMap(function () {
                    drawShips();
                    drawSightings();

                    if (selectedZone) {
                        var coords = addVectors(grid.zoneToTopLeftCoords(selectedZone), { x: -3, y: -3 });
                        drawSelector(coords, 1);
                    }
                    showShipsInZone(selectedZone);

                    // each of these knows to bail if it's not their phase
                    showArrivingShips();
                    showSearchControls();
                    
                    showShipsDue();
                    showOffMapShips();
                });
            });
        }
        
        // Initialize..........................................................

        $(document).ready(function () {
            if (side == "IJN") {
                mapLeft = 418;
                divLeft = 5;
                flagImg = "content/images/ijn-med.png";
                captionColor = "ijnred";
                var html = "<img id=\"fleet\" class=\"searchmarker\" src=\"" + imgDir + "ijnfleet.png\" />" +
                    "<img id=\"sighting\" class=\"searchmarker\" src=\"" + imgDir + "usnsighting.png\" />" +
                    "<img id=\"airsearchcursor\" class=\"cursorimg\" src=\"" + imgDir + "ijn-airsearchcursor.png\" />" +
                    "<img id=\"seasearchcursor\" class=\"cursorimg\" src=\"" + imgDir + "ijn-seasearchcursor.png\" />";
                $("#imagecache").html(html);
            }

            ajaxLoadPhase(function() {
                setTabs();
                selectedZone = game.SelectedLocation;
                ajaxLoadShips(shipsLoaded);
            });
        });
    }
};