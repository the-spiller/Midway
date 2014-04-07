// Events and functions for Phase 1 (Movement)
$("#airreadiness").on("click", function () {
    if (game.AircraftReadyState == 0)
        game.AircraftReadyState = 1;
    else if (game.AircraftReadyState == 1)
        game.AircraftReadyState = 0;
    else {
        showAlert("Air Readiness",
            "Your aircraft are ready for operations. Are you sure you want to move them down to the hangar deck?",
            DLG_YESCANCEL, "blue", function (choice) {
                if (choice == "Yes")
                    game.AircraftReadyState = 0;
            });
    }
    showAirReadiness();
    dirty = true;
});

$(document).on("mouseup", function () {
    mouseDown = false;
    if (dragThang.dragging) {
        dragThang.dragging = false;
        if (dragThang.origin == "arrivals")
            searchGrid.removeArrivalZones(side);
        else if (dragThang.useSnapshot)
            searchGrid.restoreImageData(dragThang.snapshot, 0, 0);
    }
});
$(canvas).on("mousedown", function (e) {
    canvasMouseDown(e);
}).on("mouseup", function (e) {
    canvasMouseUp(e);
});