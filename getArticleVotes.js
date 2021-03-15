// ==UserScript==
// @name         Get Article votes
// @namespace    http://tampermonkey.net/
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js
// @version      0.1
// @description  Download CSV with article votes from Zendesk
// @author       Katerina Benova
// @match        https://memsource.zendesk.com/agent/reporting/*
// @grant        GM_addStyle
// ==/UserScript==

// --- Create a button and append it to Report page navigation
var zNode = document.createElement ('span');
zNode.innerHTML = '<button id="getVotes" type="button">Get votes</button>';
zNode.setAttribute ('id', 'myContainer');

window.addEventListener('load', function() {
    document.getElementsByClassName("ember-view nav")[0].appendChild(zNode);
    document.getElementById ("getVotes").addEventListener ("click", ButtonClickAction, false);
}, false);

var url = 'https://memsource.zendesk.com/api/v2/help_center/articles.json?page=';
var page;
var page_count;
var articles;
var i;
var o;

// variables for creating the downloaded file name with date
var today = new Date();
var dd = String(today.getDate()).padStart(2, '0');
var mm = String(today.getMonth() + 1).padStart(2, '0'); //January is 0!
var yyyy = today.getFullYear();
today = yyyy+ '/' + mm + '/' + dd;


async function getData(response) {
    const dataPage = await response.json();
    articles = dataPage.articles;
    return articles;
}

function ButtonClickAction (zEvent) {
    let promiseArray = [];
    let csvArr = [["Article ID","Author ID","Title","Vote Sum","Vote Count"]];

    fetch(url).then(async (response) => {
        const data = await response.json();
        page_count = data.page_count;
        for (page = 1; page <= page_count; page++) {
            promiseArray.push(fetch(url+page).then(getData))
        }

        Promise.all(promiseArray)

        .then(promiseArray => {
            for (i=0; i < promiseArray.length; i++) {
                            console.log("article " + articles);
                for (o=0; o < promiseArray[i].length; o++) {
                    csvArr.push([promiseArray[i][o].id,promiseArray[i][o].author_id,promiseArray[i][o].name,promiseArray[i][o].vote_sum,promiseArray[i][o].vote_count]);
                }
            }
            console.log(csvArr);
            let csvContent = "data:text/csv;charset=utf-8,"
            + csvArr.map(e => e.join(";")).join("\n");
            var encodedUri = encodeURI(csvContent);
            var link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", "article_votes_" + today + ".csv");
            document.body.appendChild(link); // Required for FF
            link.click();
        })
    })
}