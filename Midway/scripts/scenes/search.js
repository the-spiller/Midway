var searchPage = {
    run: function () {
        var mapTop = 50,
            mapLeft = 5,
            divLeft = 974,
            bgImg = "content/images/search/bg-usn-search.jpg",
            flagImg = "content/images/usn-med.png",
            captionColor = "usnblue",
            game = player.Games[0],
            side = game.SideShortName,
            canvas = window.canvas,
            context = window.context,
            mousebuttonDown = false;
        
        // Event handlers......................................................

        $("#return").on("click", function () {
            ajaxGetPlayer(player.PlayerId, gotPlayer);

            function gotPlayer() {
                context.clearRect(0, 0, canvas.width, canvas.height);
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
            mapLeft = 418;
            divLeft = 5;
            bgImg = "content/images/search/bg-ijn-search.jpg";
            flagImg = "content/images/ijn-med.png";
            captionColor = "ijnred";
        }

        $("#maincanvas").css("left", mapLeft + "px");
        
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
        
        drawImage("content/images/search/searchboard.png", 0, 0, 0.8);
    }
};