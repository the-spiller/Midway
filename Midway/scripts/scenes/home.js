var homePage = {
    show: function () {
        var oppCleared = false,
            abandonables = [];
        
        // Event handlers......................................................

        $("#infolink").on("click", function() {
            showPhotoblurb();
        });

        $(".closex").on("click", function() {
            $("#infolink").trigger("click");
        });

        $("#logofflink").on("click", function() {
            removeLocal("player");
            scenes["logon"]();
        });

        $(".tablistitem").on("click", function(e) {
            $(".tablistitem, .tabpanel").removeClass("tabshown");
            var clickedId = e.target.id;
            $("#" + clickedId).addClass("tabshown");
            $("#" + clickedId.replace("tab", "")).addClass("tabshown");
        });

        $("#oppnickname").on("focus", function () {
            if (!oppCleared) {
                $("#oppnickname").val("");
                oppCleared = true;
            }
        }).on("blur", function() {
            if (!$("#oppnickname").val()) {
                $("#oppnickname").val("First available");
                oppCleared = false;
            }
        });

        $("#checkname").on("click", function() {

        });
        
        // Functions...........................................................

        function getGameListItem(loopIndex) {
            var game = player.Games[loopIndex],
                item = '<li id="game' + game.GameId + '" class="listitem"><img src="' +
                    game.TinyFlagUrl + '" /> ' + game.SideShortName,
                twoWeeks = 1000 * 60 * 60 * 24 * 14;

            if (game.OpponentNickname) {
                item += ' vs. ' + game.OpponentNickname;
                if (game.LastPlayed) {
                    var lastPlayed = new Date(game.LastPlayed);
                    var dateStr = dateTimeString(lastPlayed, !thisYear(lastPlayed));
                    item += ' (last updated ' + dateStr + ')</li>';

                    // Games more than two weeks old can be abandoned; 
                    // if less, and one must retire and take a loss
                    abandonables[loopIndex] =
                        (new Date().getMilliseconds() - lastPlayed.getMilliseconds() > twoWeeks);
                } else {
                    item += ' not started</li>';
                    abandonables[loopIndex] = false;
                }
            } else {
                item += ' waiting for opponent</li>';
                abandonables[loopIndex] = true;
            }

            return item;
        }

        function buildGameList() {
            var listHtml = "";
            if (player.Games) {
                for (var i = 0; i < player.Games.length; i++) {
                    listHtml += getGameListItem(i);
                }
                $("#gamelist ul").prepend(listHtml);
            }

            // affected event handlers needs to follow the prepend
            $(".listitem").on("mousedown", function (e) {
                $(".listitem").removeClass("down");
                $(e.target).addClass("down");
                if (getGameIdFromListItem($(e.target).attr(("id"))) < 0) {
                    $("#optopponent").slideDown();
                } else {
                    $("#optopponent").slideUp();
                }
            });
        }
        
        function getGameIdFromListItem(listItemId) {
            return Number(listItemId.replace("game", ""));
        }
        
        // Init................................................................

        drawBackground("content/images/bg-home.jpg");

        $("#welcome").html("Welcome back, " + player.Nickname +
            "! Go to a game, edit your registration info, or peruse your record.");

        var left = setInfolinkPos();
        $("#logofflink").css("left", left - 85 + "px");

        setLeft(["pagetitle", "welcome", "homediv"]);

        var welcome = document.getElementById("welcome");
        var top = welcome.offsetTop + welcome.offsetHeight + 30;
        
        $("#homediv").css("top", top + "px").draggable({
            handle: ".floathead",
            containment: "#pagediv",
            scroll: false
        });

        buildGameList();
        
        return "home";
    }
};
