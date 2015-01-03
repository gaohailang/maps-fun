var x = require('lodash');
var Crawler = require("crawler");
var cheerio = require('cheerio');

var c = new Crawler({
    maxConnections: 10,
    skipDuplicates: true,
    rateLimits: 800,
    timeout: 6000,
    onDrain: function() {
        console.log('all things done!');
        fs.writeFileSync('qyer-county.json', JSON.stringify(allRespMap.country), {
            encoding: 'utf8'
        });
        fs.writeFileSync('qyer-poi.json', JSON.stringify(allRespMap.POI), {
            encoding: 'utf8'
        });
    },
    // This will be called for each crawled page
    callback: function(error, result, $) {
        console.log(result);
        console.log($);
        // $ is Cheerio by default
        // process with diff handler for specific type url
    }
});
var allContinentApi = 'http://plan.qyer.com/api/place.php?action=getcountrylist&continent_id=0';
APIHOST = 'http://plan.qyer.com';
allRespMap = {
    country: [],
    continent: [],
    POI: [],
    pagerProcess: {},
    emptyResult: []
};
// Run MAIN
try {
    c.queue({
        url: allContinentApi,
        callback: function(error, result, $) {
            continentRespCallback(error, result, $);
            return;
            var continentAllRsep = getRespData(result.body);
            $continentAll = cheerio.load(continentAllRsep.html);
            allRespMap[allContinentApi] = continentAllRsep;
            /*x.each($continentAll('#country_typelist a'), function(i) {
                c.queue({
                    url: getContinentUrlById($continentAll(i).attr('data-typeid')),
                    callback: continentRespCallback
                });
            });*/
        }
    });
} catch (e) {
    console.log(e);
}


function continentRespCallback(error, result, $) {
    if (!result) {
        allRespMap.emptyResult.push(result.uri);
        return;
    }
    var resp = getRespData(result.body);
    allRespMap[result.uri] = resp;
    console.log('fetched ' + result.uri);
    allRespMap.country = allRespMap.country.concat(resp.list);
    console.log('country lenght now: ' + allRespMap.country.length);
    $continent = cheerio.load(resp.html);
    // lists items data-id=""
    x.each($continent('.lists .items'), function(i) {
        var id = $continent(i).attr('data-id');
        c.queue({
            url: 'http://plan.qyer.com/api/ra.php?action=country2city&countryid=' + id,
            callback: countryRespCallback
        })
    });
    // 处理大洲页中的国家分页
    if (result && !result.pageDone) {
        processUIPage($continent, continentRespCallback);
    }
}

function countryRespCallback(error, result, $) {
    if (!result) {
        allRespMap.emptyResult.push(result.uri);
        return;
    }
    var resp = getRespData(result.body);
    allRespMap[result.uri] = resp;
    console.log('fetched ' + result.uri);
    allRespMap.POI = allRespMap.POI.concat(resp.list);
    console.log('POI lenght now: ' + allRespMap.POI.length);
    // per thousand sync to file
    if (allRespMap.POI.length % 1000 > 970) {
        fs.writeFileSync('qyer-poi.json', JSON.stringify(allRespMap.POI), {
            encoding: 'utf8'
        });
    }
    $page = cheerio.load(resp.html);
    // 处理大洲页中的国家分页
    if (result && !result.pageDone) {
        processUIPage($page, countryRespCallback);
    }
}

function getContinentUrlById(id, page) {
    var url = APIHOST + '/api/place.php?action=getcountrylist&continent_id=';
    url += id;
    if (page) url += '&page=' + page;
    return url;
}

function getRespData(resp) {
    if (resp) {
        return JSON.parse(resp).data;
    }
    return null;
}

function processUIPage(dollar, handler) {
    // 优化对于 omit 类型
    var last, url;
    x.each(dollar('.ui_page .ui_page_item'), function(i) {
        // timeout defer?!
        var title = dollar(i).attr('title') || '';
        if (title === '下一页') return;
        if (title.indexOf('...') > -1) {
            console.log('ui-page omit' + title);
            var api = dollar(i).attr('def') || dollar(i).attr('href');
            if (!api) {
                debugger;
            }
            var max = title.replace('...', '');
            x.each(x.range(last, +max), function(num) {
                num += 1;
                url = APIHOST + api.replace('page=' + max, 'page=' + num);
                console.log('fetching ' + url);
                c.queue({
                    url: url,
                    callback: function(error, result, $) {
                        if (!result) {
                            allRespMap.emptyResult.push(url);
                            return;
                        }
                        result.pageDone = true;
                        handler(error, result, $);
                    }
                });
            });
        } else {
            last = dollar(i).attr('data-page');
            api = dollar(i).attr('def') || dollar(i).attr('href');
            console.log('ui-page normal ' + last);
            console.log(api);
            if (!api) {
                debugger;
            }
            c.queue({
                url: APIHOST + api,
                callback: function(error, result, $) {
                    if (!result) {
                        allRespMap.emptyResult.push(url);
                        return;
                    }
                    result.pageDone = true;
                    handler(error, result, $);
                }
            });
        }
    });
}

/*
var cheerio = require('cheerio');
var x = require('lodash');
var request = require('request');

function getRespData(resp) {
    console.log(resp);
    if(resp) {
        return JSON.parse(resp).data;
    }
    return null;
}

var allRespMap = {
    country: [],
    continent: [],
    POI: []
};

var $continentAll, continentAllRsep;
var baseAllContinentApi ='http://plan.qyer.com/api/place.php?action=getcountrylist&continent_id=0';
request.get(baseAllContinentApi, function(err, res, body) {
    continentAllRsep = getRespData(body);
    $continentAll = cheerio.load(continentAllRsep.html);
    allRespMap[baseAllContinentApi] = continentAllRsep;
    x.each($continentAll('#country_typelist a'), function(i) {
        fetchContinentById($continentAll(i).attr('data-typeid'));
    });
});

var $continent, continentResp;
function fetchContinent(url, first) {
    request.get(url, function(err, res, body) {
        continentResp = getRespData(body);
        if(!continentResp) {
            console.log(url);
            return;
        }
        $continent = cheerio.load(continentResp.html);
        allRespMap[url] = continentResp;
        allRespMap.country = allRespMap.country.concat(continentResp.list);
        if(first) {
            processUIPage($continent, fetchContinent);
        }
    });
}

var APIHOST = 'http://plan.qyer.com';
function fetchContinentById(id, page) {
    var url = APIHOST+'/api/place.php?action=getcountrylist&continent_id=';
    url += id;
    if(page) url+='&page='+page;
    return fetchContinent(url, true);
}

function processUIPage(dollar, handler) {
    // 优化对于 omit 类型
    x.each(dollar('.ui_page .ui_page_item'), function(i) {
        // timeout defer?!
        handler(dollar(i).attr('def'));
    });
}

html（包括所有大洲链接？）
list - 热门国家

http://plan.qyer.com/api/place.php?action=getcountrylist&continent_id=239

http://plan.qyer.com/api/ra.php?action=country2city&countryid=241
html 中有多少下一页 (在 ui_page 中都有 def 熟悉)

request.get('http://www.panoramio.com/map/get_panoramas.php', {
    qs: buildPanoramasQs(req.query)
}, function(err, _res, body) {
    console.log(_res);
    console.log(body);
    res.end(body);
});*/