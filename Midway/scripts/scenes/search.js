var searchPage = {
    run: function () {
        var mapTop = 50,
            mapLeft = 7,
            divLeft = 976,
            bgImg = "content/images/search/bg-usn-search.jpg",
            flagImg = "content/images/usn-med.png",
            captionColor = "usnblue",
            game = player.Games[0],
            side = game.SideShortName,
            canvas = document.getElementById("maincanvas"),
            mousebuttonDown = false;
        
        // Event handlers......................................................

        $("#return").on("click", function () {
            ajaxGetPlayer(player.PlayerId, gotPlayer);

            function gotPlayer() {
                scenes["home"]();
            }
        });

        $(".tablistitem").on("click", function(e) {
            workTabs(e);
        });

        $("#maincanvas").on("mousedown", function(e) {
            var loc = windowToCanvas(canvas, e.clientX, e.clientY);
            console.log("mousedown x: " + loc.x + " y: " + loc.y);
            mousebuttonDown = true;
        });

        $("#maincanvas").on("mousemove", function(e) {
            if (mousebuttonDown) {
                var loc = windowToCanvas(canvas, e.clientX, e.clientY);
                console.log("mousemove x: " + loc.x + " y: " + loc.y);
            }
        });
        
        $("#maincanvas").on("mouseup", function(e) {
            if (mousebuttonDown) {
                var loc = windowToCanvas(canvas, e.clientX, e.clientY);
                console.log("mouseup x: " + loc.x + " y: " + loc.y);
                mousebuttonDown = false;
            }
        })
        // Functions...........................................................
        
        
        // Init................................................................ 

        if (side == "IJN") {
            mapLeft = 421;
            divLeft = 5;
            bgImg = "content/images/search/bg-ijn-search.jpg";
            flagImg = "content/images/ijn-med.png";
            captionColor = "ijnred";
        }

        $("#maincanvas").attr({
            width: IMG_WIDTH,
            height: IMG_HEIGHT
        }).css({
            top: 0,
            left: 0,
        });
        
        $("#searchdiv").css("left", divLeft + "px").draggable({
            handle: ".floathead",
            containment: "#pagediv",
            scroll: false
        });

        $("#return").css("left", "1350px");

        setLeft(["return", "gamedesc", "searchdiv"]);

        var gameStatus = "<span class=\"shrinkit\">" + militaryDateTimeStr(gameTimeFromTurn(game.Turn), true) +
            " phase " + game.PhaseId + " vs. " + game.OpponentNickname + "</span>";
        
        $("#gamedesc").addClass(captionColor).html("<img src=\"" + flagImg + "\" />MIDWAY SEARCH " + gameStatus);
        
        drawBackground(bgImg, backgroundDone);
        
        function backgroundDone() {
            drawImage("content/images/search/searchboard.png", mapLeft, mapTop, 0.8);
        }
    }
};