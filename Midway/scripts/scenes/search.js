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
            mousebuttonDown = false,
            ships = [];

        // Event handlers......................................................

        $("#return").on("click", function() {
            ajaxGetPlayer(player.PlayerId, gotPlayer);

            function gotPlayer() {
                context.clearRect(0, 0, canvas.width, canvas.height);
                scenes["home"]();
            }
        });

        $(".tablistitem").on("click", function(e) {
            workTabs(e);
        });

        $(canvas).on("mousedown", function(e) {
            var loc = windowToCanvas(canvas, e.clientX, e.clientY);
            console.log("mousedown x: " + loc.x + " y: " + loc.y);
            mousebuttonDown = true;
        });

        $(canvas).on("mousemove", function(e) {
            if (mousebuttonDown) {
                var loc = windowToCanvas(canvas, e.clientX, e.clientY);
                console.log("mousemove x: " + loc.x + " y: " + loc.y);
            }
        });

        $(canvas).on("mouseup", function(e) {
            if (mousebuttonDown) {
                var loc = windowToCanvas(canvas, e.clientX, e.clientY);
                console.log("mouseup x: " + loc.x + " y: " + loc.y);
                mousebuttonDown = false;
            }
        })
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