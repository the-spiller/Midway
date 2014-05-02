var badPwdCount = 0,
    badPwdTries = 4,
    bgMusic;

// Event handlers......................................................

$("#btngo").on("click", function(e) {
    e.preventDefault();
    validateLogon();
});

$("#logondiv").on("keyup", function(e) {
    if (e.keyCode == 13 && $("#dlgoverlay").css("display") != "block") {
        $("#btngo").css("background-color", "#ff2b00")
            .animate({ backgroundColor: "#808080" }, 250)
            .trigger("click");
    }
});

$("#newpass").on("click", function () {
    newPassword();
});

$("#register").on("click", function () {
    navigateTo(bgMusic, "/views/register.html");
});

$("#wat").on("click", function () {
    navigateTo(bgMusic, "/views/about.html");
});

// Functions...........................................................

function validateLogon() {
    if (!validEmail("email")) {
        showBadEmailAlert();
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
        showWait("Logging on ...");
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
                    hideWait();
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
                hideWait();
                navigateTo(bgMusic, "/views/home.html");
            }
        });
    }
}

function showBadEmailAlert() {
    showAlert(
        "Missing or Bogus Email Address",
        "Please. You can't mean that this is supposed to be an email address.",
        DLG_OK,
        "blue",
        function () {
            $("#email").select().focus();
        }
    );
}

function showLockoutAlert() {
    hideWait();
    showAlert(
        "Locked Out",
        "You've exceeded the maximum number of attempts to log on with an incorrect " +
            "password, so you are temporarily locked out.<br /><br />Please try again later.",
        DLG_OK,
        "red"
    );
}

function newPassword() {
    if (!hasText("email")) {
        showAlert(
            "Missing Email",
            "We'll need your email address if we're going to send you a new password, don't you think?",
            DLG_OK,
            "blue"
        );
    } else if (!validEmail("email")) {
        showBadEmailAlert();
    } else {
        showWait("Generating password and sending email ...");
        ajaxGetPlayerByEmail(function() {
            ajaxPutWithUrlArgs(0, function () {
                window.player.Lockout = 0;  // Remove any lockout condition
                showAlert(
                    "Password Sent",
                    "We sent a new password to your email address. Log on using it and you can change " +
                        "it to something more reasonable on the home page.",
                    DLG_OK,
                    "blue"
                );
            });
        });
    }
}

function ajaxGetPlayerByEmail(successCallback) {
    $.ajax({
        url: "/api/player",
        type: "GET",
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
                    "We looked <span class='i'>everywhere</span> for your email address and just couldn't find it among those of " +
                        "our registered players.<br /><br />Are you registered? If so, I'd suggest that perhaps you mistyped it.",
                    DLG_OK, "red", hilightEmail);
            } else {
                showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "red", hilightEmail);
            }
        }
    });
}

// Make unsecured PUTs to modify our player by setting lockout or mailing new password.
// Full update is not called from this page and is secured.
function ajaxPutWithUrlArgs(lockout, successCallback) {
    $.ajax({
        url: "/api/player?playerId=" + window.player.PlayerId + "&lockout=" + lockout,
        type: "PUT",
        success: function () {
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            if (!errorThrown) {
                showAlert("Error", "Ajax call resulted in an unspecified error.", DLG_OK, "red");
            } else {
                showAlert(xhr.status + " " + errorThrown, xhr.responseText, DLG_OK, "red");
            }
        }
    });
}

function hilightEmail() {
    $("#email").select();
    $("#email").focus();
}

function ajaxSetLockout(successCallback) {
    var twentyMin = 1000 * 60 * 20,
        lockout = new Date().getTime() + twentyMin;

    window.player.Lockout = lockout;
    ajaxPutWithUrlArgs(lockout, successCallback);
}

// Init........................................................................

$(document).ready(function () {
    if (!cookiesEnabled()) {
        showAlert("Sorry", "Your browser settings must allow cookies in order to play Midway.", DLG_OK, "red");
    }

    $("#logondiv").draggable({
        handle: ".floathead",
        containment: "#pagediv",
        scroll: false
    });

    $("#email").focus();
    window.currentPage = "logon";
});

