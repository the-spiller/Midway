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
            mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"],
            selectedZone = "";

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
            showSelectedZone(e);
            showShipsInZone(selectedZone);
        });
        
        // Functions...........................................................

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

        function getShipListHtml(ship) {
            var hitsDir = "content/images/search/ships/hits/",
                shipId = (ship.Location == "ARR" ? "arrship" : "ship") + ship.Id,
                html = "<li><div id=\"" + shipId + "\" class=\"noselect shipitem\" draggable=\"true\"><img src=\"" +
                    ship.SearchImgPath + "\" />";

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
        
        function showShipsInZone(zone) {
            var i, html = "<ul>";
            
            for (i = 0; i < ships.length; i++) {
                if (ships[i].Location == zone) {
                    html += getShipListHtml(ships[i]);
                }
            }
            $("#zone").html(html + "<ul>");
            
            // Event handler for ships in a zone (might be set by arrivals)
            if (game.PhaseId != 1) {
                $(".shipitem").on("click", function(e) {
                    doShipSelection(e, $(this));
                });
            }
        }
        
        function showArrivingShips() {
            var i, html = "<ul>";
            
            for (i = 0; i < ships.length; i++) {
                if (ships[i].Location == "ARR") {
                    html += getShipListHtml(ships[i]);
                }
            }
            $("#arrivals").html(html + "<ul>");

            // Event handlers for arrivals
            $(".shipitem").on("click", function (e) {
                doShipSelection(e, $(this));
            });
        }
        
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
        
        function coordsToZone(coords) {
            var x = coords.x;
            var y = coords.y;
            
            if (x < 28 || x > 962 || y < 28 || y > 746)
                return "";

            var zoneRow = (y - 27) / 36;
            var row = Math.floor(zoneRow / 3 + 1).toString();
            var areaRow = Math.floor(zoneRow % 3 + 1);
            
            var zoneCol = (x - 27) / 36;
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
        
        function zoneToZoneTopLeft(zone) {
            var col = 0;
            for (var i = 0; i < mapCols.length; i++) {
                if (zone.indexOf(mapCols[i] == 0)) {
                    col = i * 36 + 27;
                    break;
                }
            }
            var row = (Number(zone.substring(1, 1)) - 1) * 36 + 27;

            switch(zone.substr(2, 1)) {
                case "B":
                    col += 36;
                    break;
                case "C":
                    col += 72;
                    break;
                case "D":
                    row += 36;
                    break;
                case "E":
                    row += 36;
                    col += 36;
                    break;
                case "F":
                    row += 36;
                    col += 72;
                    break;
                case "G":
                    row += 72;
                    break;
                case "H":
                    row += 72;
                    col += 36;
                    break;
                case "I":
                    row += 72;
                    col += 72;
                    break;
            }
            return { x: col, y: row };
        }
        
        function coordsToZoneTopLeft(coords) {
            var zonesX = Math.floor((coords.x - 27) / 36),
                zonesY = Math.floor((coords.y - 27) / 36);

            return { x: zonesX * 36 + 27, y: zonesY * 36 + 27 };
        }

        function showSelectedZone(e) {
            var topLeft;
            
            if (selectedZone != "") {
                topLeft = zoneToZoneTopLeft(selectedZone);
                context.clearRect(topLeft.x - 3, topLeft.y - 3, topLeft.x + 40, topLeft.y + 40);
            }
            var canvasLoc = windowToCanvas(canvas, e.clientX, e.clientY);
            topLeft = coordsToZoneTopLeft(canvasLoc);
            context.drawImage(document.getElementById("selectedZone"), topLeft.x - 3, topLeft.y - 3);
            selectedZone = coordsToZone(canvasLoc);
        }
        
        function gotShips() {
            $("#searchcanvas").css("left", mapLeft + "px");
            $("#searchdiv").css("left", divLeft + "px").draggable({
                handle: ".floathead",
                containment: "#pagediv",
                scroll: false
            });
            $("#return").css("left", "1330px");

            var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
                " phase " + game.PhaseId + " vs. " + game.OpponentNickname + "</span>";
            $("#gamedesc").addClass(captionColor).html("<img src=\"" + flagImg + "\" />MIDWAY SEARCH " + gameStatus);

            $("#pagediv").css("background-image", "url(\"" + bgImg + "\")");

            drawMap();

            if (game.PhaseId == 1) {
                showArrivingShips();
            }
        }
        
        // Init................................................................ 
        
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