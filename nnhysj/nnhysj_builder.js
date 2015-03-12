var fs = require('fs');
var _ = require('lodash'); // snippt used in node REPL, which _ is reserved word
var rawUrlCarMap = fs.readFileSync('nnhysj_urlCardMap.json', {
    encoding: 'utf8'
});

var rawTitleUrlArr = fs.readFileSync('nnhysj_result.json', {
    encoding: 'utf8'
});

var urlCarMap = JSON.parse(rawUrlCarMap);
var titleUrlArr = JSON.parse(rawTitleUrlArr);
var outputHtml = '<h1>暖暖环游世界图文攻略</h1>';

var nnhysjChar = '&#x6696;&#x6696;&#x73AF;&#x6E38;&#x4E16;&#x754C;';
var strategyChart = '&#x56FE;&#x6587;&#x653B;&#x7565;';

var styleText = '';

_.each(titleUrlArr, function(i) {
    // outputHtml += '<h2>' + i.part + '</h2>';
    i.chapters.sort(function(a, b) {
        function charity(a) {
            return +(a.replace('第', '').replace('关', ''));
        }
        return charity(a.title) - charity(b.title);
    });
    _.each(i.chapters, function(ii) {
        outputHtml += '<div class="chapter-page">' + urlCarMap[ii.url].replace(nnhysjChar, '').replace(strategyChart, '') + '</div>';
    });
});

fs.writeFileSync('xx.html', outputHtml + styleText, {
    encoding: 'utf8'
});