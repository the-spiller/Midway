var searchPage = {
    run: function() {
        var canvas = document.getElementById("searchcanvas"),
            context = canvas.getContext("2d"),
            mapLeft = 5,
            divLeft = 974,
            bgImg = "content/images/search/bg-usn-search.jpg",
            flagImg = "content/images/usn-med.png",
            captionColor = "usnblue",
            game = player.Games[0],
            side = game.SideShortName,
            ships = [],
            lastShipSelected = null,
            zoneSize = 36,
            mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            selectedZone = "",
            selImg,
            dragThang = { dragging: false, origin: "", dragData: null };

        // Event handlers......................................................

        $("#return").on("click", function() {
            ajaxGetPlayer(player.PlayerId, gotPlayer);

            function gotPlayer() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                scenes["home"]();
            }
        });

        $(".tablistitem").on("click", function (e) {
            workTabs(e);
        });

        $(canvas).on("click", function (e) {
            selectZone(windowToCanvas(canvas, e.clientX, e.clientY));
            showShipsInZone();
        }).on("mousedown", function (e) {
            canvasMouseDown(e);
        });
        
        // Functions...........................................................

        /*-------------------------------------------------------------------*/
        /* Draw the search map semi-transparently and size the canvas to     */
        /* match its dimensions.                                             */
        /*-------------------------------------------------------------------*/
        function drawMap(callback) {
            var img = new Image();
            img.src = "content/images/search/searchboard.png";
            img.onload = function() {
                canvas.height = img.height;
                canvas.width = img.width;
                context.globalAlpha = 0.8;
                context.drawImage(img, 0, 0);
                if (callback) callback();
            };
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
        /* Callback for ajaxLoadShips call above. Set up the various display */
        /* elements, draw the search map and add event handlers for dynamic  */
        /* elements (not in the html).                                       */
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

            drawMap();

            if (game.PhaseId == 1) {
                $("#arrivalstab").css("display", "inline-block").addClass("tabshown");
                $("#arrivals").addClass("tabshown");
                showArrivingShips();
            } else {
                $("#arrivalstab").css("display", "none");
                $("#zone, #zonetab").addClass("tabshown");
            }

            // Event handlers for ship lists
            $(".shipitem").on("click", function (e) {
                doShipSelection(e, $(this));
            }).on("mousedown", function(e) {
                shipitemMouseDown(e);
            }).on("mouseup", function() {
                shipitemMouseUp();
            });
        }
        
        /*-------------------------------------------------------------------*/
        /* Build up and return the HTML for a single ship list item.         */
        /*-------------------------------------------------------------------*/
        function getShipListItemHtml(ship) {
            var hitsDir = "content/images/search/ships/hits/",
                shipId = (ship.Location == "ARR" ? "arrship-" : "ship-") + ship.Id,
                html = "<li><div id=\"" + shipId + "\" class=\"noselect shipitem\"><img src=\"" +
                    ship.SearchImgPath + "\"  draggable=\"false\"/>";

            if (ship.ShipType == "CV" || ship.ShipType == "CVL") {
                html += "<div class=\"numplanes torpedo\">" + ship.TSquadrons +
                    "</div><div class=\"numplanes fighter\">" + ship.FSquadrons +
                    "</div><div class=\"numplanes divebomber\">" + ship.DSquadrons + "</div>";
            }
            html += "<div class=\"shiphits green\"><img src=\"" + hitsDir + ship.HitsToSink +
                "-hitsgreen.png\"></div>";
            
            if (ship.Hits > 0) {
                html += "<div class=\"shiphits red\"><img src=\"" + hitsDir + ship.Hits +
                    "-hitsred.png\"></div></div></li>";
            }
            return html;
        }
        
        /*-------------------------------------------------------------------*/
        /* Display on the Zone tab any ships in the currently selected zone. */
        /*-------------------------------------------------------------------*/
        function showShipsInZone() {
            var i, html;

            if (selectedZone == "H5G")
                html = "Midway <ul>";
            else
                html = "Zone " + selectedZone + "<ul>";
            
            for (i = 0; i < ships.length; i++) {
                if (ships[i].Location == selectedZone) {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#zone").html(html + "<ul>");
        }
        
        /*-------------------------------------------------------------------*/
        /* Display on the Arrived tab any ships that arrived this turn.      */
        /*-------------------------------------------------------------------*/
        function showArrivingShips() {
            var i, html = "<ul>";
            
            for (i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR") {
                    html += getShipListItemHtml(ships[i]);
                }
            }
            $("#arrivals").html(html + "<ul>");
        }
        
        /*-------------------------------------------------------------------*/
        /* Respond to a click or Shift-click on a ship list item. Click      */
        /* toggles selected state; Shift-click selects or deselects a range. */
        /*-------------------------------------------------------------------*/
        function doShipSelection(e, $this) {
            if (!lastShipSelected) {
                $this.addClass("selected");
                lastShipSelected = $this;
                return;
            }
            if (e.shiftKey) {
                var start = $(".shipitem").index($this);
                var end = $(".shipitem").index(lastShipSelected);

                if (lastShipSelected.hasClass("selected")) {
                    $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).addClass("selected");
                } else {
                    $(".shipitem").slice(Math.min(start, end), Math.max(start, end) + 1).removeClass("selected");
                }
            } else {
                if ($this.hasClass("selected"))
                    $this.removeClass("selected");
                else
                    $this.addClass("selected");
            }
            lastShipSelected = $this;
        }
        
        /*-------------------------------------------------------------------*/
        /* Convert input canvas coordinates to the name of the zone that     */
        /* contains them.                                                    */
        /*-------------------------------------------------------------------*/
        function coordsToZone(coords) {
            var x = coords.x;
            var y = coords.y;
            
            if (x < 28 || x > 962 || y < 28 || y > 746)
                return "";

            var zoneRow = (y - 27) / zoneSize;
            var row = Math.floor(zoneRow / 3 + 1).toString();
            var areaRow = Math.floor(zoneRow % 3 + 1);
            
            var zoneCol = (x - 27) / zoneSize;
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
                    col = (i * areaSize) + 27;
                    break;
                }
            }
            var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + 27;

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
            var zonesX = Math.floor((coords.x - 27) / 36),
                zonesY = Math.floor((coords.y - 27) / 36);

            return { x: zonesX * 36 + 27, y: zonesY * 36 + 27 };
        }

        /*-------------------------------------------------------------------*/
        /* 
        /*-------------------------------------------------------------------*/
        function selectZone(point) {
            var topLeft = coordsToTopLeftCoords(point),
                top = topLeft.y - 3,
                left = topLeft.x - 3;

            if (selectedZone) {
                var oldTopLeft = zoneToTopLeftCoords(selectedZone),
                    oldTop = oldTopLeft.y - 3,
                    oldLeft = oldTopLeft.x - 3;
                context.putImageData(selImg, oldLeft, oldTop);
            }
            
            var newImg = document.getElementById("selectedZone");
            selImg = context.getImageData(left, top, newImg.width, newImg.height);
            context.drawImage(newImg, left, top);
            selectedZone = coordsToZone(point);
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getShipsInZone(zone) {
            var zoneShips = [];
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Location == zone) {
                    zoneShips.push(ships[i]);
                }
            }
            return zoneShips;
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getSelectedArrivals() {
            var selShips = [];
            if ($("#arrivals").hasClass("tabshown")) {
                var list = $("#arrivals").find("div.shipitem"), id;

                for (var i = 0; i < list.length; i++) {
                    if ($(list[i]).hasClass("selected")) {
                        id = list[i].id.substr(list[i].id.indexOf("-") + 1);
                        selShips.push(getShipById(id));
                    }
                }
            }
            return selShips;
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function getShipById(id) {
            for (var i = 0; i < ships.length; i++) {
                if (ships[i].Id == id) {
                    return ships[i];
                }
            }
            return null;
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function relocateShips(zone, movedShips) {
            for (var i = 0; i < movedShips.length; i++) {
                movedShips[i].Location = zone;
            }
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function shipitemMouseDown(e) {
            var selShips = getSelectedArrivals();
            if (selShips.length > 0) {
                dragThang.dragging = true;
                dragThang.origin = "arrivals";
                dragThang.dragData = selShips;

                canvas.addEventListener("mousemove", canvasMouseMove, false);
            }
            canvas.removeEventListener("mousedown", canvasMouseDown, false);
            canvas.addEventListener("mouseup", canvasMouseUp, false);
            e.preventDefault();
            
            console.log("mousedown with " + selShips.length + " ships");
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function shipitemMouseUp() {
            canvas.addEventListener("mousedown", canvasMouseDown, false);
            canvas.removeEventListener("mouseup", canvasMouseUp, false);
            if (dragThang.dragging) {
                dragThang.dragging = false;
                canvas.removeEventListener("mousemove", canvasMouseMove, false);
            }
            console.log("mouseup");
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseDown(e) {
            var zone = coordsToZone(windowToCanvas(canvas, e.ClientX, e.ClientY)),
                shipsInZone = getShipsInZone(zone);
            
            if (shipsInZone.length > 0) {
                dragThang.dragging = true;
                dragThang.origin = zone;
                dragThang.dragData = shipsInZone;
                
                canvas.addEventListener("mousemove", canvasMouseMove, false);
            }
            canvas.removeEventListener("mousedown", canvasMouseDown, false);
            canvas.addEventListener("mouseup", canvasMouseUp, false);
            e.preventDefault();

            console.log("mousedown");
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseMove(e) {
            console.log("drag");
        }
        
        /*-------------------------------------------------------------------*/
        /*-------------------------------------------------------------------*/
        function canvasMouseUp(e) {
            canvas.addEventListener("mousedown", canvasMouseDown, false);
            canvas.removeEventListener("mouseup", canvasMouseUp, false);
            if (dragThang.dragging) {
                dragThang.dragging = false;
                canvas.removeEventListener("mousemove", canvasMouseMove, false);

                var zone = coordsToZone(windowToCanvas(canvas, e.clientX, e.clientY));
                relocateShips(zone, dragThang.dragData);
                
                console.log("drop " + dragThang.origin + " on " + zone);
            } else {
                console.log("mouseup");
            }
        }
        
        // Initialize..........................................................
        
        if (side == "IJN") {
            mapLeft = 418;
            divLeft = 5;
            bgImg = "content/images/search/bg-ijn-search.jpg";
            flagImg = "content/images/ijn-med.png";
            captionColor = "ijnred";
        }

        ajaxLoadShips(gotShips);
    }
};