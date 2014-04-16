
function windowToCanvas(canvas, x, y) {
    var boundsbox = canvas.getBoundingClientRect();
    return {
        x: x - boundsbox.left * (canvas.width / boundsbox.width),
        y: y - boundsbox.top * (canvas.height / boundsbox.height)
    };
}

function getElementTopLeft(elem) {
    var box = elem.getBoundingClientRect(),
        body = document.body,
        docElem = document.documentElement,
        scrollTop = window.pageYOffset || docElem.scrollTop || body.scrollTop,
        scrollLeft = window.pageXOffset || docElem.scrollLeft || body.scrollLeft,
        clientTop = docElem.clientTop || body.clientTop || 0,
        clientLeft = docElem.clientLeft || body.clientLeft || 0,
        x = box.left + scrollLeft - clientLeft,
        y = box.top + scrollTop - clientTop;

    return { x: Math.round(x), y: Math.round(y) };
}

function isNumber(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
}

function teletype(id, text, delay) {
    function typechar(chr) {
        if (chr == '◄' && document.getElementById(id).innerHTML >= 1) {
            document.getElementById(id).innerHTML = document.getElementById(id).innerHTML.substr(0, document.getElementById(id).innerHTML.length - 1);
        }
        else {
            document.getElementById(id).innerHTML += chr;
        }
    }

    var counter = 0;
    for (var i = 0; i < text.length; i++) {
        setTimeout(function () {
            var chr = text[counter];
            typechar(chr);
            counter++;
        },
		delay * i);
    }
}

function validEmail(textElementId) {
    var email = document.getElementById(textElementId),
        filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

    if (!filter.test(email.value)) {
        return false;
    }
    return true;
}

function hasText(textElementId) {
    if ($("#" + textElementId).length == 0 || $("#" + textElementId).val().length == 0) {
        return false;
    }
    return true;
}

function inArray(needle, haystack) {
    for (var x = 0; x < haystack.length; x++) {
        if (haystack[x] === needle) {
            return true;
        }
    }
    return false;
}

// DateTime stuff..............................................................

function militaryDateTimeStr(date, includeYear) {
    var hourStr = date.getHours() < 10 ? "0" + date.getHours() + "00" : date.getHours() + "00",
        dayStr = date.getDate() < 10 ? "0" + date.getDate() : date.getDate(),
        monthStr = getMonthName(date.getMonth()),
        retStr = hourStr + " " + dayStr + " " + monthStr;
    
    if (includeYear) {
        return retStr + " " + date.getFullYear();
    }
    return retStr;
}

function getMonthName(monthNum) {
    switch (monthNum) {
        case 1:
            return "January";
        case 2:
            return "February";
        case 3:
            return "March";
        case 4:
            return "April";
        case 5:
            return "May";
        case 6:
            return "June";
        case 7:
            return "July";
        case 8:
            return "August";
        case 9:
            return "September";
        case 10:
            return "October";
        case 11:
            return "November";
        case 12:
            return "December";
        default:
            return "";
    }  
}

function parseIso8601(str) {
    // assumes str is a UTC date string (e.g. "2014-03-05T17:07:51.2573372Z")
    // ignores milliseconds
    var working = str.substr(0, str.indexOf(".")),
        parts = working.split('T'),
        dateParts = parts[0].split('-'),
        timeParts = parts[1].split(':'),
        date = new Date();

    date.setUTCFullYear(Number(dateParts[0]));
    date.setUTCMonth(Number(dateParts[1]) - 1);
    date.setUTCDate(Number(dateParts[2]));
    date.setUTCHours(Number(timeParts[0]));
    date.setUTCMinutes(Number(timeParts[1]));
    date.setUTCSeconds(Number(timeParts[2]));

    // by using setUTC methods the date has already been converted to local time
    return date;
}

function prettyTimeAgo(dateWhen, dateNow) {
    if (dateNow == null) dateNow = new Date();
    var diff = (dateNow.getTime() - dateWhen.getTime()) / 1000,  //seconds
        dayDiff = Math.floor(diff / 86400); //days

    if (isNaN(dayDiff) || dayDiff < 0)
        return undefined;

    switch (true) {
        case(diff < 60):
            return "just now";
        case (diff < 120):
            return "a minute ago";
        case (diff < 3600):
            return Math.round(diff / 60) + " minutes ago";
        case (diff < 7200):
            return "an hour ago";
        case (diff < 86400):
            return Math.round(diff / 3600) + " hours ago";
        case (dayDiff == 1):
            return "yesterday";
        case (dayDiff < 14):
            return dayDiff + " days ago";
        default:
            return Math.round(dayDiff / 7) + " weeks ago"; 
    }
}

// Read/write localStorage and/or cookies......................................

function saveLocal(key, value) {
    if (localStorageSupported()) {
        localStorage.setItem(key, value);
    } else if (cookiesEnabled()) {
        createCookie(key, value, 999);
    }
}

function readLocal(key) {
    if (localStorageSupported()) {
        return localStorage.getItem(key);
    } else if (cookiesEnabled()) {
        return readCookie(key);
    }
    return null;
}

function removeLocal(key) {
    if (localStorageSupported()) {
        localStorage.removeItem(key);
    } else if (cookiesEnabled()) {
        eraseCookie(name);
    }
}

// Local Storage...............................................................

function localStorageSupported() {
    try {
        return "localStorage" in window && window["localStorage"] !== null;
    } catch (e) {
        return false;
    }
}

// Cookies.....................................................................

function cookiesEnabled() {
    var cookieEnabled = (navigator.cookieEnabled) ? true : false;

    if (typeof navigator.cookieEnabled == "undefined" && !cookieEnabled) {
        document.cookie = "testcookie";
        cookieEnabled = (document.cookie.indexOf("testcookie") != -1) ? true : false;
        createCookie("testcookie", "", -1);
    }
    return (cookieEnabled);
}

function createCookie(name, value, days) {
    var expires = "";
    
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toGMTString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}

function readCookie(name) {
    var nameEq = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEq) == 0) return c.substring(nameEq.length, c.length);
    }
    return null;
}

function eraseCookie(name) {
    createCookie(name, "", -1);
}
// END Local Storage

// Element location............................................................

function findPos(el) {
    var curleft = 0, curtop = 0;
    
    if (el.offsetParent) {
        do {
            curleft += el.offsetLeft;
            curtop += el.offsetTop;
        }
        while (el = el.offsetParent);
    }

    return { left: curleft, top: curtop };
}

// Vector math.................................................................

function addVectors(vector1, vector2) {
    return { x: vector1.x + vector2.x, y: vector1.y + vector2.y };
}

// URL parameters..............................................................

function getUrlParameter(name) {
    return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search) || [, ""])[1].replace(/\+/g, '%20')) || null;
}
