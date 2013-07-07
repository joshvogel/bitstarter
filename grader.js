#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var rest = require('restler');
var HTMLFILE_DEFAULT = "index.html";
var URLFILE_DEFAULT = "temp.html";
var CHECKSFILE_DEFAULT = "checks.json";

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.log("%s does not exist. Exiting.", instr);
        process.exit(1); 
    }
    return instr;
};

var assertTempFileExists = function(infile){
    var instr = infile.toString();
    return fs.existsSync(instr);
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var checkHtmlFile = function(htmlfile, checksfile) {
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var buildfn = function(htmlFile){
    var checkHtmlUrl2 = function(result, response){
	if (result instanceof Error){
	    console.error('Error: ' + util.format(response.message));
	}else {
	    fs.writeFileSync(htmlFile, result);
	    console.log('created temp.html');
	}
    };
    return checkHtmlUrl2;
};

var createTemp = function(inUrl){
    var instr = inUrl.toString();
    var makeFile = buildfn('temp.html');
    rest.get(instr).on('complete', makeFile);
};
   

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file <html_file>', 'Path to index.html', clone(assertFileExists), HTMLFILE_DEFAULT)
        .option('-u, --url <URL_string>', 'Path to url', clone(createTemp), URLFILE_DEFAULT)
        .parse(process.argv);
    if(!assertTempFileExists('temp.html')){
	var checkJson = checkHtmlFile(program.file, program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
    }
    else {
	var checkJson = checkHtmlFile(program.url,program.checks);
	var outJson = JSON.stringify(checkJson, null, 4);
	console.log(outJson);
	fs.unlinkSync('temp.html');
    }
} else {
    exports.checkHtmlFile = checkHtmlFile;
}

