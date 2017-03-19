#!/usr/bin/env node

var https = require('https');
var fs = require('fs');
var child_process = require('child_process');

var meow = require('meow');
var Promise = require('bluebird');
var fetch = require('node-fetch');
fetch.Promise = Promise;
var cheerio = require('cheerio');

var cli = meow({
  help: [
    'Usage',
    '  ydict <vocabulary>',
    '  ydict <vocabulary> -s: pronunciate',
    '  ydict --help          : display help ',
    'Options',
    '  -s   prouncate the vocabulary'
  ].join('\n')
});
var fetch_headers = {'Referer': 'https://tw.dictionary.yahoo.com/dictionary'};

// parse html to produce a JSON representation
function parseBody(body) {
  var $ = cheerio.load(body);
  var word = $('.summary').eq(0).find('h2').text();
  if (!word) {
    console.log('vocabulary not found.');
    return null;
  }
  var sound_src = $('audio').attr('src');
  var $pronun = $('.pronun');
  var kk = $('span dd', $pronun).eq(0).text();
  var dj = $('span dd', $pronun).eq(1).text();
  var $expLists = $('.exp-list');
  var explanations = $expLists.map(function(i, el) {
    var $el = $(el)
    var expItems = $el.find('.exp-item');
    var type = $el.prev().text();
    var items = expItems.map(function(j, item) {
      return {
        exp: $(item).find('.exp').text(),
        sample: $(item).find('.sample').text().replace(/\s+/g, ' ').trim()
      }
    })
    return {type: type, items: items};
  });
  return {
    sound_src: sound_src,
    pronun: {kk: kk, dj: dj},
    word: word,
    explanations: explanations
  };
}

function printResult(o) {
  if (!o) {
    return;
  }
  console.log(o.word);
  console.log('KK' + o.pronun.kk + ' DJ' + o.pronun.dj + '\n');
  o.explanations.forEach(function(explanation) {
    console.log(explanation.type);
    explanation.items.forEach(function (item, index) {
      console.log( (index + 1) + '. ' + item.exp);
      if (item.sample)
        console.log('   ' + item.sample);
    });
    console.log('');
  });
  return Promise.resolve(o);
}

function playSound(o) {
  var sound_local = '/tmp/' + o.word + '.mp3';
  var file = fs.createWriteStream(sound_local);
  https.get(o.sound_src, function (rsp) {
    rsp.on('data', function (data) {
      return file.write(data);
    })
    rsp.on('end', function () {
      file.end();
      try {
        child_process.exec("afplay " + sound_local);
      } 
      catch(e) {
        // die silently
      }
    })
  })
}

if (cli.input.length === 0) {
    console.log('please input one vocabulary');
} else {
  var q = cli.input[0];
  var url = "https://tw.dictionary.yahoo.com/dictionary?p=" + q;

  var runner = 
    fetch(url, {headers: fetch_headers})
      .then(function(res) {
        return res.text();
      })
      .then(parseBody)
      .then(printResult)
  
  if (cli.flags.s) {
    runner
      .then(playSound)
      .catch(console.log.bind(console));
  } else {
    runner
      .catch(console.log.bind(console));
  }
}
