var homePage = {
    show: function () {
        var oppCleared = false,
            oppMatched = false,
            selGameId = 0,
            abandonables = [],
            nicknames = FuzzySet();
        
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

        $(".tablistitem").on("click", function (e) {
            $(".tablistitem, .tabpanel").removeClass("tabshown");
            var clickedId = e.target.id;
            $("#" + clickedId).addClass("tabshown");
            $("#" + clickedId.replace("tab", "")).addClass("tabshown");
        });

        $("#quitgame").on("click", function() {
            var msg, caption;
            if (abandonables[selGameId]) {
                caption = "Abandon Game";
                msg = "Are you sure you want to abandon this game?" +
                    " It will go into your record as a draw.";
            } else {
                caption = "Retire";
                msg = "Are you sure you want to retire?" +
                    " It will go into your record as a loss (and a free win for your opponent).";
            }
            showAlert(caption, msg, DLG_YESNO, "blue", btnPressed);
            
            function btnPressed(button) {
                if (button == "Yes") {
                    alert("Abandon/retire logic goes here.");
                }
            }
        });

        $("#playgame").on("click", function () {
            console.log("game " + selGameId);
            if (selGameId == 0) return;

            var game = {};
            if (selGameId < 0) {
                // create and save a new game
                alert("Create and save new game goes here.");
            } else {
                // find the selected game
                for (var i = 0; i < player.Games.length; i++) {
                    if (player.Games[i].GameId == selGameId) {
                        console.log(player.Games[i].GameId + ", " + player.Games[i].SideShortName + ", " + player.Games[i].OpponentNickname);
                        game = player.Games[i];
                        break;
                    }
                }
            }
            // Make this game the only one
            player.Games = [];
            player.Games.push(game);
            console.log(game.GameId + ", " + game.SideShortName + ", " + game.OpponentNickname);
            
            //scenes["search"]();
            alert("Load of search scene goes here.");
        });
        
        $("#oppnickname").on("focus", function () {
            if (!oppCleared) {
                $(this).val("");
                oppCleared = true;
            }
        }).on("blur", function() {
            if (!$(this).val()) {
                $(this).val("First available");
                oppCleared = false;
            }
        }).on("keyup", function (e) {
            var oppselect = document.getElementById("oppselect");
            if ($(this).val()) {
                if (oppselect.length && e.keyCode == 40) {
                    $(oppselect).focus();
                } else {
                    var results = nicknames.get($(this).val());
                    if (results == null || results.length > 10) {
                        closeOppSelect();
                        oppMatched = false;
                    } else {
                        var selHtml = "";
                        for (var i = 0; i < results.length; i++) {
                            selHtml += "<option>" + results[i][1] + "</option>";
                        }
                        $(oppselect).attr("size", results.length).html(selHtml);
                        $("#oppselectdiv").css({ "display": "block" });
                    }
                    if (oppselect.length == 1 && !oppMatched) {
                        $(this).val($(oppselect).text());
                        setTimeout(function () {
                            closeOppSelect();
                            oppMatched = true;
                        }, 500);
                    }
                }
            } else {
                closeOppSelect();
                oppMatched = false;
            }
        }).on("input", function () {
            if (!$(this).val()) {
                closeOppSelect();
                oppMatched = false;
            }
        });

        $("#oppselect").on("keyup", function(e) {
            if (e.keyCode == 38 && $(this).prop("selectedIndex") == 0) {
                $("#oppnickname").focus();
            } else {
                var selText = $("#oppselect>option:selected").text();
                if (e.keyCode == 13 && selText) {
                    $("#oppnickname").val(selText);
                    closeOppSelect();
                    oppMatched = true;
                }
            }
        }).on("click", function(e) {
            if (e.target) {
                $("#oppnickname").val($(e.target).val());
                closeOppSelect();
                oppMatched = true;
            }
        });
        
        // Functions...........................................................
        
        function getGameListItem(game) {
        /*-------------------------------------------------------*/
        /* Build up html for one game for the 'Your Games' list. */
        /*-------------------------------------------------------*/
            var item = '<li id="game' + game.GameId + '" class="listitem"><img src="' +
                game.TinyFlagUrl + '" /> ' + game.SideShortName,
            twoWeeks = 1000 * 60 * 60 * 24 * 14;

            if (game.OpponentNickname) {
                item += ' vs. ' + game.OpponentNickname;
                if (game.LastPlayed) {
                    var lastPlayed = new Date(game.LastPlayed);
                    // build last-played date string - only show year if it's other than this year
                    var dateStr = dateTimeString(lastPlayed, !thisYear(lastPlayed));
                    item += ' (last played ' + dateStr + ')</li>';

                    // Games more than two weeks old can be abandoned; 
                    // if less, to quit one must retire and take a loss.
                    var dateNow = new Date();
                    abandonables[game.GameId] =
                        (dateNow.getTime() - lastPlayed.getTime() > twoWeeks);
                } else {
                    item += ' not started</li>';
                    abandonables[game.GameId] = true;
                }
            } else {
                item += ' waiting for opponent</li>';
                abandonables[game.GameId] = true;
            }
            return item;
        }

        function buildGameList() {
        /*----------------------------------------------------*/
        /* Get html for each of the player's incomplete games */
        /* for the 'Your Games' list, and display it.         */
        /*----------------------------------------------------*/
            var listHtml = "";
            if (player.Games) {
                for (var i = 0; i < player.Games.length; i++) {
                    if (player.Games[i].CompletedDTime == null) {
                        listHtml += getGameListItem(player.Games[i]);
                    }
                }
                $("#gamelist ul").prepend(listHtml);
            }

            // affected event handler needs to follow the prepend
            $(".listitem").on("mousedown", function (e) {
                $(".listitem").removeClass("down");
                $(e.target).addClass("down");
                selGameId = Number(e.target.id.replace("game", ""));
                if (selGameId < 0) {
                    $("#optopponent").slideDown();
                    $("#quitgame").css("display", "none");
                    $("#playgame").text("Create");
                    $("#quitgame").css("display", "none");
                    setOppselectPos();
                } else {
                    $("#optopponent").slideUp();
                    $("#playgame").text("Play");
                    $("#quitgame").css("display", "inline-block")
                        .text(abandonables[selGameId] ? "Abandon": "Retire");
                }
            });
        }

        function setOppselectPos() {
        /*----------------------------------------------------*/
        /* Calc the location and width of the opponent search */
        /* select based on the opponent nickname text input.  */
        /*----------------------------------------------------*/
            var oppnickname = document.getElementById("oppnickname");
            var oTop = oppnickname.offsetTop + oppnickname.offsetHeight + 12;
            var oLeft = oppnickname.offsetLeft;
            var oWidth = oppnickname.offsetWidth;
            $("#oppselectdiv").css({ "left": oLeft + "px", "top": oTop + "px" });
            $("#oppselect").css("width", oWidth + "px");
        }
        
        function closeOppSelect() {
            /*------------------------------------------------*/
            /* Clear out and hide the nickname search select. */
            /*------------------------------------------------*/
            $("#oppselect").html("");
            $("#oppselectdiv").css("display", "none");
            $("#oppnickname").focus();
        }
        
        function getPlayers() {
        /*----------------------------------------------*/
        /* Get a list of all players' nicknames for the */
        /* new game optional opponent search/select.    */
        /*----------------------------------------------*/
            ajaxGetPlayers(gotPlayers);

            function gotPlayers(list) {
                for (var i = 0; i < list.length; i++) {
                    nicknames.add(list[i].Nickname);
                }
            }
        }

        function buildRecord() {
        /*--------------------------------------------------------------*/
        /* Build up the player's won-lost record from  his or her games */
        /* and display it in a table on the 'Your Record' tab.          */
        /*--------------------------------------------------------------*/
            var record = [],
                recIndex,
                html = "";
            
            // build table of game outcomes
            for (var i = 0; i < player.Games.length; i++) {
                var game = player.Games[i];

                recIndex = -1;
                for (var j = 0; j < record.length; j++) {
                    if (game.OpponentNickname == record[i][0]) {
                        recIndex = j;
                        break;
                    }
                }
                if (recIndex == -1) {
                    recIndex = record.push([game.OpponentNickname, 0, 0, 0]) - 1;
                }
                if (game.Draw == "Y") { // all incomplete games; some complete games (abandoned)
                    record[recIndex][3]++;
                } else if (game.Points < game.OpponentPoints) {
                    record[recIndex][2]++;
                } else {
                    record[recIndex][1]++;
                }
            }
            
            // display the table
            for (i = 0; i < record.length; i++) {
                html += "<tr><td class='name'>" + record[i][0] + "</td><td class='number'>" + record[i][1] +
                    "</td><td class='number'>" + record[i][2] + "</td><td class='number'>" + record[i][3] +
                    "</td></tr>";
            }
            $("#recordtable").append(html);
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
        getPlayers();
        buildRecord();
        buildGameList();
        
        return "home";
    }
};
