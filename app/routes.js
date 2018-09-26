var URLDATA = require('./models/urldata');
const puppeteer = require('puppeteer');
const Wappalyzer = require('wappalyzer');
var ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const chromedriver = require('chromedriver');

const chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', {args: ['--headless']});

const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .withCapabilities(chromeCapabilities)
  .build();

const options = {
  debug: false,
  delay: 500,
  maxDepth: 3,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

function runAnalyzer(url, doc_id) {
    const wappalyzer = new Wappalyzer('https://'+ url, options);
    wappalyzer.analyze()
      .then(json => {
        var result = [];
        for (var app in json.applications) {
            result.push(json.applications[app].name);
        }
        URLDATA.update({"_id" : doc_id},{$set : {"applications" : result}})
        console.log(result);
      })
      .catch(error => {
        console.log(error);
    });
  };


function getURLInfo(doc_id, res) {
    URLDATA.find({_id : doc_id}, function(err, urlinfo) {
        if (err) {
           console.log(err);
        } 
        res.json(urlinfo); 
    });
};

async function getScreenshot(domain, filename) {
    let screenshot;
    const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'], ignoreHTTPSErrors: true });
    const page = await browser.newPage();

    try {
        await page.goto('http://' + domain + '/');
        await page.setViewport({ width: 1920, height: 1080 });
        await page.screenshot({ path: './public/images/'+filename+'.jpg', type: 'jpeg', fullPage: true });
    } catch (error) {
        try {
            await page.goto('https://' + domain + '/');
            await page.setViewport({ width: 1920, height: 1080 });
            await page.screenshot({ path: './public/images/'+filename+'.jpg', type: 'jpeg', fullPage: true });
        } catch (error) {
            console.error('Connecting to: ' + domain + ' failed due to: ' + error);
        }
    await page.close();
    await browser.close();
    }
}

async function run(url, callback) {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage();
    const response = await page.goto('https://' + url + '/');


  //  const response = await page.goto('https://' + url + '/');  
    const urls = [];

    try {
       // Get all navigation redirects
        page.on('request', request => {
        const frame = request.frame();
        if (frame.url() !== urls[urls.length - 1] && frame.url() !== "about:blank") {
        urls.push(frame.url());
        }
      });
    } catch (err) {
        console.log("caught an exception", err);
    }

     //IP address of the remote server
    var ipObj = response.remoteAddress();


    // get last redirected url
    var lastUrl;
    if(urls.length > 0)
        lastUrl = urls[urls.length - 1]; 
    else
        lastUrl = 'Not Redirected';

    //A redirectChain is a chain of requests initiated to fetch a resource.
    const chain = response.request().redirectChain();
    var redirectChainLen = chain.length;

    URLDATA.create({
            text: url,
            url: url,
            redirectedUrl : lastUrl,
            redirectChainLength: redirectChainLen,
            ipAddress: ipObj.ip,
            applications: null
        }, function (err, urlinfo) {
            if (err){
                console.log("This is error case");
                console.log(err);
            }
            return callback(urlinfo._id);
            // get and return all the url data after creating one in db
        });
    await page.close();
    await browser.close();
};

module.exports = function (app) {

    // api ---------------------------------------------------------------------
    // To get url info
    app.get('/api/url/:url_id', function (req, res) {
        // use mongoose to get urlinfo in the database
        getURLInfo(req.params.url_id, res);
    });

    // add url info to db and send back infos after creation
    app.post('/api/url', function (req, res) {

        // Navigate to google.com, enter a search.
        run(req.body.text, function(response){
            var doc_id = response;
            runAnalyzer(req.body.text, doc_id);
            getScreenshot(req.body.text, doc_id);
            getURLInfo(doc_id, res);
        });
    });

    // delete a url info
    app.delete('/api/url/:url_id', function (req, res) {
        URLDATA.remove({
            _id: req.params.url_id
        }, function (err, todo) {
            if (err)
                res.send(err);

            getURLInfo(res, req.params.url_id);
        });
    });

    // application -------------------------------------------------------------
    app.get('*', function (req, res) {
        res.sendFile(__dirname + '/public/index.html'); // load the single view file (angular will handle the page changes on the front-end)
    });
};
