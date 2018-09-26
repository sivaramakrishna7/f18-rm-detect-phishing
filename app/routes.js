var URLDATA = require('./models/urldata');
const puppeteer = require('puppeteer');
const Wappalyzer = require('wappalyzer');
var ObjectId = require('mongodb').ObjectID;
const fs = require('fs');
const webdriver = require('selenium-webdriver');
const chromedriver = require('chromedriver');
const path = require('path');

const chromeCapabilities = webdriver.Capabilities.chrome();
chromeCapabilities.set('chromeOptions', {args: ['--headless']});

const driver = new webdriver.Builder()
  .forBrowser('chrome')
  .withCapabilities(chromeCapabilities)
  .build();

const options = {
  debug: false,
  delay: 0,
  maxDepth: 2,
  maxUrls: 10,
  maxWait: 5000,
  recursive: true,
  userAgent: 'Wappalyzer',
  htmlMaxCols: 2000,
  htmlMaxRows: 2000,
};

function runAnalyzer(url, callback) {
    const wappalyzer = new Wappalyzer('https://'+ url, options);
    wappalyzer.analyze()
      .then(json => {
        var result = [];
        for (var app in json.applications) {
            result.push(json.applications[app].name);
        }
        console.log(result);
        return callback(result)
      })
      .catch(error => {
        console.log(error);
        return callback(error)
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

async function getScreenshot(domain, filename, callback) {
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
    return callback("Success");
}

async function run(url, wap, callback) {
    let browser = await puppeteer.launch({ headless: true });
    let page = await browser.newPage({ignoreHTTPSErrors: true});
    //page.setIgnoreHTTPSErrors(true);
    const response = await page.goto('http://' + url + '/');


  //  const response = await page.goto('https://' + url + '/');  
    const urls = [];

    try {
       // Get all navigation redirects
        page.on('request', request => {
        const frame = request.frame();
        if (frame.url() !== urls[urls.length - 1] && frame.url() !== "about:blank") {
        urls.push(frame.url());
        console.log("Print URLs : ");
        console.log(urls);
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
            applications: wap
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
        console.log("URL ID INFO GET : ", req.params.url_id)
        getURLInfo(req.params.url_id, res);
    });

    // add url info to db and send back infos after creation
    app.post('/api/url', function (req, res) {

        // Navigate to google.com, enter a search.
        runAnalyzer(req.body.text, function(wap){
        run(req.body.text, wap, function(response){
            var doc_id = response;
            getScreenshot(req.body.text, doc_id, function(img){
                getURLInfo(doc_id, res);
                console.log("image created : ", img);
            });
          });
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
        res.sendFile(path.join(__dirname, '../public/', 'index.html')); // load the single view file (angular will handle the page changes on the front-end)
    });
};
