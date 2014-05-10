
// Events and functions for Phase 4 (Air Defense Setup)

function loadPhaseTab() {
    var tabHtml = "<div style=\"margin: 5px 0 15px 5px;\">";
    if (game.Waiting == "Y") {
        tabHtml += "Waiting for opponent</div>";
    } else {
        // List zones under attack 
        // Respond to click my moving to Battle Board w/ all ships in that zone
        makeSuggestion();
    }
    $("#airdefense").html(tabHtml);
}

$(document).ready(function () {

});
    


