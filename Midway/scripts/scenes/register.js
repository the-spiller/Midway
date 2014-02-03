﻿var registerPage = {
    show: function () {

        // Event handlers......................................................

        $("#return").on("click", function () {
            scenes["logon"]();
        });

        $("#infolink").on("click", function () {
            showPhotoblurb();
        });
        
        $(".closex").on("click", function () {
            $("#infolink").trigger("click");
        });

        $("#btngo").on("click", function () {
            if (!validEmail("email")) {
                showAlert(
                    "Missing or Bogus Email Address",
                    "Is that really supposed to be an email address?",
                    DLG_OK, "blue",
                    function () {
                        $("#email").select().focus();
                    }
                );
            } else if (!hasText("nickname")) {
                showAlert(
                    "Missing Nickname",
                    "What's the matter, can't come up with a sufficiently cool nickname? ",
                    DLG_OK, "blue",
                    function () {
                        $("#nickname").focus();
                    }
                );
            } else {
                window.player = new Object();
                player.Email = $("#email").val();
                player.Nickname = $("#nickname").val();

                ajaxRegisterPlayer(function () {
                    showAlert("Registration Successful",
                        "You are now registered. Expect to receive a password in email that will allow you to " +
                            "log in the first time.<br /><br />We hope you enjoy our game!",
                        DLG_OK, "blue", function () {
                            scenes["logon"]();
                        });
                });
            }
        });

        $("#registerdiv").on("keyup", function (e) {
            if (e.keyCode == 13) {
                $("#btngo").trigger("click");
            }
        });

        // Functions...........................................................
        
        function ajaxRegisterPlayer(successCallback) {
            $.ajax({
                url: "/api/player",
                type: "POST",
                data: player,
                success: function (data) {
                    player = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    if (!errorThrown)
                        showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "yellow");
                    else
                        showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "yellow");
                }
            });
        }
        
        // Init................................................................

        drawBackground("content/images/bg-register.jpg");
        $("#welcome").css("width", "1125");

        $("#registerdiv").draggable({
            handle: ".floathead",
            containment: "#pagediv",
            scroll: false
        });

        var left = setInfolinkPos();
        $("#return").css("left", left - 40 + "px");
        setLeft(["pagetitle", "welcome"]);

        $("#email").focus();
        return "register";
    }
};