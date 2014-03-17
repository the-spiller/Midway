var registerPage = {
    name: "registration",
    run: function () {

        // Event handlers......................................................

        $("#return").on("click", function () {
            pages.logon();
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
                window.player = { Email: $("#email").val(), Nickname: $("#nickname").val() };
                ajaxRegisterPlayer(function () {
                    showAlert("Registration Successful",
                        "You are now registered. Expect to receive a password in email that will allow you to " +
                            "log in the first time.<br /><br />We hope you enjoy our game!",
                        DLG_OK, "blue", function () {
                            pages.logon();
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
                data: window.player,
                success: function (data) {
                    window.player = JSON.parse(data);
                    createUpdateAuthCookie();
                    if (successCallback) successCallback();
                },
                error: function (xhr, status, errorThrown) {
                    if (!errorThrown)
                        showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "red");
                    else
                        showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "red");
                }
            });
        }
        
        // Init................................................................
        $(document).ready(function() {
            $("#pagediv").css("background-image", "url(\"content/images/bg-register.jpg\")");
            $("#welcome").css("width", "1125");
            $("#return").css({ position: "absolute", top: "10px", left: "1288px" });
            
            $("#registerdiv").draggable({
                handle: ".floathead",
                containment: "#pagediv",
                scroll: false
            });
            
            hideWait();
            $("#email").focus();
            window.currentPage = "register";
        });
    }
};