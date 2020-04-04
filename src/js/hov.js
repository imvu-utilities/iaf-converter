var hovQueue = [];
var hovRequests = [];

function hovAddAvi(response, aviId) {
    var start = response.indexOf("og:title")
    var urlBlock = response.substr(start, 30);
    var rgx = /"/gi, result, indices = [];
    while ((result = rgx.exec(urlBlock))) {
        indices.push(result.index);
    }
    var aviName = urlBlock.slice(indices[1] + 1, indices[2]);
    var hovTag = $('<p />', { text: aviName });
    $('#' + aviId).prepend(hovTag);
}

function hovAddProd(response, product, aviId) {
    var imgStart = response.indexOf("og:image");
    var imgBlock = response.substr(imgStart, 200);
    var rgx = /"/gi, result, indices = [];
    while ((result = rgx.exec(imgBlock))) {
        indices.push(result.index);
    }
    var imgUrl = imgBlock.slice(indices[1] + 1, indices[2]);
    var titleStart = response.indexOf("og:title");
    var titleBlock = response.substr(titleStart, 50);
    indices.length = 0;
    while ((result = rgx.exec(titleBlock))) {
        indices.push(result.index);
    }
    var prodTitle = titleBlock.slice(indices[1] + 1, indices[2]);
    var decoder = document.createElement('textarea');
    decoder.innerHTML = prodTitle;
    prodTitle = decoder.value;
    var hovTag = $('<img />').attr({
        src: imgUrl,
        title: prodTitle
    });
    var hovUrl = $('<a />').attr({
        href: "https://www.imvu.com/shop/product.php?products_id=" + product
    });
    hovUrl.append(hovTag);
    $('#' + aviId).append(hovUrl);
}

function strip(product) {
    if (product.includes("x")) {
        return product.substr(0, product.indexOf("x"));
    } else {
        return product;
    }
}

function unhide(evt) {
    hovQueue.forEach(q => clearTimeout(q));
    hovRequests.forEach(r => r.abort());
    hovQueue.length = 0;
    hovRequests.length = 0;
    // $('#unhide-btn').prop('disabled', true);
    $('#hov').remove();
    $('<div />').attr('id', 'hov').appendTo('#hov-container');
    var avatars = [];
    var allProds = [];
    var currProds = [];
    var prodsUrl = evt["hov-url"].value.split("%3B")
    prodsUrl.forEach(function (line) {
        if (line.includes("avatar")) {
            var avUrl = line.split("avatar");
            // console.log(avUrl);
            if (avUrl[0].includes('&')) {
                currProds.push(strip(avUrl[0].slice(0, -1)));
                allProds.push(currProds);
            }
            currProds = [];
            var avSep = avUrl[1].split("=");
            avatars.push(avSep[0]);
            currProds.push(strip(avSep[1]));
        } else if (line.includes("room")) {
            var rmUrl = line.split("room");
            if (rmUrl[0].includes('&')) {
                currProds.push(strip(rmUrl[0].slice(0, -1)));
                allProds.push(currProds);
            }
            currProds = [];
            avatars.push("Room");
            currProds.push(strip(rmUrl[1].slice(1)));
        } else {
            currProds.push(strip(line));
        }
    })
    allProds.push(currProds);
    currProds = [];

    avatars.forEach(avi => {
        $('<div />').attr('id', avi).appendTo('#hov');
    })

    var time = 0;
    var delay = 500;

    allProds.forEach(function (prodList, idx) {
        time++;
        if (avatars[idx] == "Room") {
            queued = setTimeout(function () {
                $('<p />', { text: "Room" }).prependTo('#' + avatars[idx]);
            }, time * delay)
            hovQueue.push(queued)
        } else {
            queued = setTimeout(function () {
                requested = $.ajax({
                    url: "https://www.imvu.com/shop/web_search.php?manufacturers_id=" + avatars[idx],
                    success: function (response) {
                        hovAddAvi(response, avatars[idx]);
                    }
                });
                hovRequests.push(requested);
            }, time * delay) 
            hovQueue.push(queued)
        }
        prodList.forEach(prod => {
            time++;
            queued = setTimeout(function () {
                requested = $.ajax({
                    url: "https://www.imvu.com/shop/product.php?products_id=" + prod,
                    success: function (response) {
                        hovAddProd(response, prod, avatars[idx]);
                    }
                });
                hovRequests.push(requested);
            }, time * delay)
            hovQueue.push(queued)
        })
    })
}