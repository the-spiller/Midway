function SearchGrid() {
    this.zoneSize = 36;
    this.mapMargin = 27;
    this.mapCols = ["A", "B", "C", "D", "E", "F", "G", "H", "I"];
}
SearchGrid.prototype = {
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to the name of the search map    */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToZone: function (coords) {
        var x = coords.x,
            y = coords.y;
            
        if (x < 28 || x > 962 || y < 28 || y > 746)
            return "";

        var zoneRow = (y - this.mapMargin) / this.zoneSize;
        var row = Math.floor(zoneRow / 3 + 1).toString();
        var areaRow = Math.floor(zoneRow % 3 + 1);
            
        var zoneCol = (x - this.mapMargin) / this.zoneSize;
        var colRow = this.mapCols[Math.floor(zoneCol / 3)] + row;
        var areaCol = Math.floor(zoneCol % 3 + 1);
            
        var areaRowCol = areaRow * 10 + areaCol;
        switch (areaRowCol) {
            case 11:
                return colRow + "A";
            case 12:
                return colRow + "B";
            case 13:
                return colRow + "C";
            case 21:
                return colRow + "D";
            case 22:
                return colRow + "E";
            case 23:
                return colRow + "F";
            case 31:
                return colRow + "G";
            case 32:
                return colRow + "H";
            default:
                return colRow + "I";
        }
    },
    /*-------------------------------------------------------------------*/
    /* Convert a zone name to its top left canvas coordinates.           */
    /*-------------------------------------------------------------------*/
    zoneToTopLeftCoords: function (zone) {
        var col = 0;
        var areaSize = this.zoneSize * 3;
        for (var i = 0; i < this.mapCols.length; i++) {
            if (zone.charAt(0) == this.mapCols[i]) {
                col = (i * areaSize) + this.mapMargin;
                break;
            }
        }
        var row = ((Number(zone.substr(1, 1)) - 1) * areaSize) + this.mapMargin;
        switch(zone.substr(2, 1)) {
            case "B":
                col += this.zoneSize;
                break;
            case "C":
                col += this.zoneSize * 2;
                break;
            case "D":
                row += this.zoneSize;
                break;
            case "E":
                row += this.zoneSize;
                col += this.zoneSize;
                break;
            case "F":
                row += this.zoneSize;
                col += this.zoneSize * 2;
                break;
            case "G":
                row += this.zoneSize * 2;
                break;
            case "H":
                row += this.zoneSize * 2;
                col += this.zoneSize;
                break;
            case "I":
                row += this.zoneSize * 2;
                col += this.zoneSize * 2;
                break;
        }
        return { x: col, y: row };
    },
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* zone that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToTopLeftCoords: function (coords) {
        var zonesX = coords.x - this.mapMargin < 0 ? 0 : Math.floor((coords.x - this.mapMargin) / this.zoneSize),
            zonesY = coords.y - this.mapMargin < 0 ? 0 : Math.floor((coords.y - this.mapMargin) / this.zoneSize);
        return { x: (zonesX * this.zoneSize) + this.mapMargin, y: (zonesY * this.zoneSize) + this.mapMargin };
    },
    /*-------------------------------------------------------------------*/
    /* Calculate and return the distance, in zones, between two zones.   */
    /*-------------------------------------------------------------------*/
    zoneDistance: function (zone1, zone2) {
        var zone1Coords = this.zoneToTopLeftCoords(zone1),
            zone2Coords = this.zoneToTopLeftCoords(zone2),
            zone1Adj = {
                x: zone1Coords.x - this.mapMargin < 0 ? 0 : zone1Coords.x - this.mapMargin,
                y: zone1Coords.y - this.mapMargin < 0 ? 0 : zone1Coords.y - this.mapMargin
            },
            zone2Adj = {
                x: zone2Coords.x - this.mapMargin < 0 ? 0 : zone2Coords.x - this.mapMargin,
                y: zone2Coords.y - this.mapMargin < 0 ? 0 : zone2Coords.y - this.mapMargin
            },
            zonesX = Math.floor(Math.abs(zone1Adj.x - zone2Adj.x) / this.zoneSize),
            zonesY = Math.floor(Math.abs(zone1Adj.y - zone2Adj.y) / this.zoneSize);
        return Math.max(zonesX, zonesY);
    },
    /*-------------------------------------------------------------------*/
    /* Convert input canvas coordinates to those of the top left of the  */
    /* area that contains them.                                          */
    /*-------------------------------------------------------------------*/
    coordsToAreaTopLeftCoords: function(coords) {
        return this.zoneToTopLeftCoords(this.coordsToZone(coords).substr(0, 2) + "A");
    }
};