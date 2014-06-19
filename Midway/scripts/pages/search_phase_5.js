
// Events and functions for Phase 5 (Air Defense Setup)
var attacks = [],
    defenseSetups = [], //parallel array of flags indicating battle map air defense setup completed
    showingAttacks = false;

$(document).on("mouseover", ".attackitem", function (e) {
    showingAttacks = true;
    showAttackSources(e.target.id);
}).on("mouseout", ".attackitem", function () {
    if (showingAttacks) {
        showingAttacks = false;
        searchGrid.hideAttacksFrom();
    }
}).on("click", ".gobattle", function (e) {
    goToBattleMap($(e.target).text());
});
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function loadAirDefensePhase() {
    ajaxGetOppAirAttacks(function() {
        var tabHtml = "<div style=\"margin: 5px;\">Zones under attack:<ul>";
        for (var i = 0; i < attacks.length; i++) {
            tabHtml += getAttackItemHtml(attacks[i]);
        }
        tabHtml += "</ul><p style=\"margin-top: 10px; font-size: .85em;\">Hover to see attack sources<br />" +
            "Click zone button to go to battle map</p></div>";
        $("#airdefense").html(tabHtml);
    });
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function showAttackSources(elementId) {
    var zone = elementId.substr(4),
        coords = searchGrid.zoneToTopLeftCoords(zone),
        locations = [];
    
    selectZone(coords);
    for (var i = 0; i < attacks.length; i++) {
        if (attacks[i].Zone == zone) {
            for (var j = 0; j < attacks[i].AirOpSources.length; j++) {
                var loc = attacks[i].AirOpSources[j].SourceLocation;
                if ($.inArray(loc, locations) == -1)
                    locations.push(loc);
            }
            break;
        }
    }
    searchGrid.showAttacksFrom(locations);
}

/*---------------------------------------------------------------------------*/
/* Get html for one attack item in the Air Defense tab list                  */
/*---------------------------------------------------------------------------*/
function getAttackItemHtml(attack) {
    var atkHtml = "<div class=\"attackitem\" id=\"zone" + attack.Zone + "\">" +
        "<a class=\"gobattle flatbutton graybtn\" id=\"btn-" + attack.Zone + "\">" + attack.Zone + "</a>" +
        "<img class=\"attackimage\" src=\"" + searchDir + side + "def.png\" />",
        squads = [0, 0, 0],
        planeTypes = ["t", "f", "d"];
    
    for (var i = 0; i < attack.AirOpSources.length; i++) {
        var source = attack.AirOpSources[i];
        squads[0] += source.TSquadrons;
        squads[1] += source.FSquadrons;
        squads[2] += source.DSquadrons;
    }
    if (attack.CapSquadrons > 0) {
        atkHtml += "<img class=\"attackimage\" src=\"" + searchDir + side + "defcap.png\" />";
    }
    for (i = 0; i < 3; i++) {
        if (squads[i] > 0) {
            var imgSrc = searchDir + side + "def" + planeTypes[i] + ".png";
            atkHtml += "<img class=\"attackimage\" src=\"" + imgSrc + "\" />";
        }
    }
    atkHtml += "<div class=\"attackitemdetail\">" + attack.AircraftTotals + "<br />CAP" + attack.CapSquadrons  + "</div></div>";
    //atkHtml += "</div>";
    return atkHtml;
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function ajaxGetOppAirAttacks(successCallback) {
    // retrieve opponent's attacks on this player's fleets
    $.ajax({
        url: "/api/airop",
        type: "GET",
        data: { playerId: game.OpponentId, gameId: game.GameId },
        accepts: "application/json",
        success: function (data) {
            createUpdateAuthCookie();
            attacks = JSON.parse(data);
            //remove non-attack ops and init array of done flags
            for (var i = attacks.length - 1; i > -1; i--) {
                if (attacks[i].Mission == "Attack")
                    defenseSetups.push(false);
                else
                    attacks.splice(i);
            }
            if (successCallback) successCallback();
        },
        error: function (xhr, status, errorThrown) {
            showAjaxError(xhr, status, errorThrown);
        }
    });
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function allSetupsDone() {
    for (var i = 0; i < defenseSetups.length; i++) {
        if (defenseSetups[i] == false) {
            return false;
        }
    }
    return true;
}
/*---------------------------------------------------------------------------*/
/*---------------------------------------------------------------------------*/
function goToBattleMap(zone) {
    navigateTo(bgMusic, "/views/battle.html?gid=" + game.GameId + "&zone=" + zone);
}

$(document).ready(function () {
    $("#done").addClass("disable");
});
    


