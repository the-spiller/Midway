var searchPage = {
    show: function () {

        // Event handlers......................................................

        $("#return").on("click", function () {
            scenes["logon"]();
        });

        // Functions...........................................................
        
        
        // Init................................................................

        drawBackground("content/images/bg-search.jpg");
        drawImage("content/images/searchboard.png", 0, 109);
    }
};