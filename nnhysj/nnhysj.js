var x = require('lodash');
var Crawler = require("crawler");
var cheerio = require('cheerio');
var fs = require('fs');

// var x, dollar;
var c = new Crawler({
    maxConnections: 30,
    skipDuplicates: true,
    rateLimits: 800,
    timeout: 6000,
    onDrain: function() {
        saveCardJson();
    },
    callback: function(err, result, $) {
        console.log('Crawlering Url ' + result.uri);
        /*x = result;
        dollar = $*/
    }
});

var StartPageUrl = 'http://www.18183.com/nnhysj/146535.html';
var resultContainer = [];
var urlCardMap = {};
try {
    c.queue({
        url: StartPageUrl,
        callback: function(err, result, $) {
            x.each($('#right_upd .m_dom'), function(box, idx) {
                var $box = $(box);
                var title = $box.find('h5').text();
                if (title == '热门攻略') return;
                console.log('Crawlering Part ' + title);
                resultContainer.push({
                    part: title,
                    chapters: x.map($box.find('.r_ul li'), function(li, idx2) {
                        var $li = $(li);
                        var url = $li.find('a').attr('href');
                        console.log(url);
                        c.queue({
                            url: url,
                            callback: function(err, result, $) {
                                console.log('Crawlering Chapter ' + $li.text());
                                debugger;
                                urlCardMap[url] = getCardFromPage($);
                                /*try {
                                    urlCardMap[url] = getCardFromPage($);
                                    resultContainer[idx]['chapters'][idx2].content = getCardFromPage($);
                                } catch (e) {
                                    console.log(idx + ' ' + idx2);
                                    console.warn(e);
                                }*/
                            }
                        });
                        return {
                            title: $li.text(),
                            url: url
                        };
                    })
                });
            });
        }
    });
} catch (e) {
    console.log(e);
}


function getCardFromPage($) {
    $('.article_box').find('table').remove();
    return $('.article_box').html();
}

function getUrlListFromSidebar() {

}

function saveCardJson() {
    fs.writeFileSync('nnhysj_result.json', JSON.stringify(resultContainer), {
        encoding: 'utf8'
    });

    fs.writeFileSync('nnhysj_urlCardMap.json', JSON.stringify(urlCardMap), {
        encoding: 'utf8'
    });
}

function buildHugeHtml() {

}

function genPdfFromHtml() {

}