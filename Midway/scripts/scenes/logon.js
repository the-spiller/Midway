var logonPage = {
    name: "logon",
    run: function() {
        var badPwdCount = 0,
            badPwdTries = 5;

        // Event handlers......................................................

        $("#infolink").on("click", function() {
            showPhotoblurb();
        });

        $(".closex").on("click", function() {
            $("#infolink").trigger("click");
        });

        $("#btngo").on("click", function(e) {
            e.preventDefault();
            validateLogon();
        });

        $("#logondiv").on("keyup", function(e) {
            if (e.keyCode == 13) {
                $("#btngo").trigger("click");
            }
        });

        $("#newpass").on("click", function() {
            newPassword();
        });

        $("#register").on("click", function () {
            showWait("Loading", "Loading registration page, please wait ...", "blue");
            pages.register();
        });

        $("#wat").on("click", function () {
            showWait("Loading", "Loading about page, please wait ...", "blue");
            pages.about();
        });

        // Functions...........................................................

        function validateLogon() {
            if (!validEmail("email")) {
                showAlert(
                    "Missing or Bogus Email Address",
                    "C'mon. You don't mean that this is supposed to be an email address.",
                    DLG_OK,
                    "blue",
                    function() {
                        $("#email").select().focus();
                    }
                );
            } else if (!hasText("pwd")) {
                showAlert(
                    "That Won't Work",
                    "You've got a password, right? Well, use it!",
                    DLG_OK,
                    "blue",
                    function() {
                        $("#pwd").focus();
                    }
                );
            } else {
                ajaxGetPlayerByEmail(function() {
                    if (window.player.Lockout > new Date().getTime()) {
                        showLockoutAlert();
                    } else if (window.player.Password != $("#pwd").val()) {
                        badPwdCount++;
                        if (badPwdCount > badPwdTries) {
                            ajaxSetLockout(function() {
                                badPwdCount = 0;
                                showLockoutAlert();
                            });
                        } else {
                            showAlert(
                                "Bad Password",
                                "No way, pal. The password you've entered is a no-go.<br /><br />" +
                                    "Try again without fat-fingering it this time!",
                                DLG_OK,
                                "red",
                                function() {
                                    $("#pwd").select().focus();
                                }
                            );
                        }
                    } else {
                        createUpdateAuthCookie();
                        if ($("#stay").prop("checked")) createCookie("mdylogin", window.player.PlayerId.toString(), 2);
                        showWait("Loading", "Loading home page, please wait ...", "blue");
                        pages.home();
                    }
                });
            }
        }
        // end function validateLogon()

        function showLockoutAlert() {
            showAlert(
                "Locked Out",
                "You've exceeded the maximum number of attempts to log on with an incorrect " +
                    "password, so you are temporarily locked out.<br /><br />Please try again later.",
                DLG_OK,
                "red"
            );
        }
        // end function showLockoutAlert()

        function newPassword() {
            if (!hasText("email")) {
                showAlert(
                    "Missing Email",
                    "We need your email address if we're going to send you a new password, don't you think?",
                    DLG_OK,
                    "blue"
                );
            } else {
                ajaxGetPlayerByEmail(function() {
                    ajaxSendPassword(function() {
                        showAlert(
                            "Password Sent",
                            "We sent a new password to your email address. Log on using it and you can change " +
                                "it to something more reasonable at 'Your Registration' on the home page.",
                            DLG_OK,
                            "blue"
                        );
                    });
                });
            }
        }
        // end function newPassword()

        function ajaxGetPlayerByEmail(successCallback) {
            $.ajax({
                url: "/api/player",
                accepts: "application/json",
                data: { "emailAddress": $("#email").val() },
                success: function(data) {
                    window.player = JSON.parse(data);
                    if (successCallback) successCallback();
                },
                error: function(xhr, status, errorThrown) {
                    if (!errorThrown) {
                        showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "red");
                    } else if (errorThrown.indexOf("Player") == 0) {
                        showAlert(errorThrown,
                            "We looked <span class='i'>everywhere</span> for your email address and just " +
                                "couldn't find it.<br /><br />I'd suggest that perhaps you mistyped it.",
                            DLG_OK, "red", hilightEmail);
                    } else {
                        showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "red", hilightEmail);
                    }
                }
            });
        }
        // end function ajaxGetPlayerByEmail()

        function hilightEmail() {
            $("#email").select();
            $("#email").focus();
        }
        
        function ajaxSendPassword(successCallback) {
            window.player.Password = null;
            ajaxUpdatePlayer(successCallback);
        }
        // end function ajaxSendPassword()

        function ajaxSetLockout(successCallback) {
            var twentyMin = 1000 * 60 * 20;
            window.player.Lockout = new Date().getTime() + twentyMin;
            ajaxUpdatePlayer(successCallback);
        }
        // end function ajaxSetLockout()

        // Init................................................................
        $(document).ready(function() {
            $("#pagediv").css("background-image", "url(\"content/images/bg-logon.jpg\")");
            $("#infolink").css({ top: "365px", left: "42px" });
            window.showingInfo = false;

            if (!cookiesEnabled()) {
                showAlert("Cookies", "You must allow cookies in order to play Midway.", "red");
            }

            $("#logondiv").draggable({
                handle: ".floathead",
                containment: "#pagediv",
                scroll: false
            });

            if (player) {
                $("#email").val(window.player.Email);
                $("#pwd").focus();
            } else {
                $("#email").focus();
            }
            window.currentPage = "logon";
        });
    }
};
