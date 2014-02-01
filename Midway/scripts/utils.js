
function windowToCanvas(canvas, x, y) {
    var boundsbox = canvas.getBoundingClientRect();
    return {
        x: x - boundsbox.left * (canvas.width / boundsbox.width),
        y: y - boundsbox.top * (canvas.height / boundsbox.height)
    };
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
    if ($("#" + textElementId).val().length == 0) {
        return false;
    }
    return true;
}

function in_array(needle, haystack) {
    for (var x = 0; x < haystack.length; x++) {
        if (haystack[x] === needle) {
            return true;
        }
    }
    return false;
}

// DateTime stuff

function dateTimeString(date, includeYear) {
    if (includeYear)
        return date.getMonth() + "/" + date.getDate() + "/" + date.getFullYear() + " " +
            date.getHours() + ":" + date.getMinutes();
    else
        return date.getMonth() + "/" + date.getDate() + " " + date.getHours() + ":" + date.getMinutes();
}

function thisYear(dateToTest) {
    var date = new Date();
    return (date.getYear() == dateToTest.getYear());
}

// Read/write localStorage and/or cookies

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

// Element location

function findPos(obj) {
    var curleft = 0, curtop = 0;
    
    if (obj.offsetParent) {
        do {
            curleft += obj.offsetLeft;
            curtop += obj.offsetTop;
        }
        while (obj = obj.offsetParent);
    }

    return { left: curleft, top: curtop };
}