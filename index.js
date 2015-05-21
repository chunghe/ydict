
var argv, async, cheerio, child_process, exec, file, fs, http, q, request, sound_local, speak, url;

http = require('http');

request = require('request');

fs = require('fs');

child_process = require('child_process');

http = require('http');

exec = child_process.exec;

async = require('async');

cheerio = require('cheerio');

argv = require('optimist').usage('command line interface for tw.dictionary.yahoo.com').alias('s', 'speak').describe('speak the word').alias('r', 'rank').describe('display rank information').argv;

q = argv._[0] || argv.speak;

if (!q) {
  console.log('please sepcify keyword');
  process.exit(1);
}

url = "http://tw.dictionary.search.yahoo.com/search?p=" + q + "&fr2=dict";

sound_local = "/tmp/" + q + ".mp3";

file = fs.createWriteStream(sound_local);

speak = function(sound_url) {
  return request = http.get(sound_url, function(rsp) {
    rsp.on('data', function(data) {
      return file.write(data);
    });
    return rsp.on('end', function() {
      file.end();
      return exec("afplay " + sound_local);
    });
  });
};

async.parallel([
  function() {
    return request(url, function(error, rsp, body) {
      var $, $pronun, $sections, data, sound_url, word;
      $ = cheerio.load(body);
      data = [];
      word = $('.title_term .yschttl').text();
      console.log(word);
      $pronun = $('.proun_wrapper');
      sound_url = $pronun.find('.proun_sound a').attr('href');
      if (sound_url && argv.speak) {
        speak(sound_url);
      }
      console.log($pronun.text());
      $sections = $('.result_cluster_first .explanation_pos_wrapper');
      return $sections.each(function(i, section) {
        var $exp_item, $hd, $section, abbr, desc;
        $section = $(section);
        $hd = $section.find('.explanation_group_hd');
        abbr = $hd.find('.pos_abbr').text();
        desc = $hd.find('.pos_desc').text();
        $exp_item = $section.find('.explanation_ol li');
        console.log(abbr + "  " + desc);
        return $exp_item.each(function(index, item) {
          var $item, exp, sample;
          $item = $(item);
          exp = $item.find('.explanation').text();
          sample = $item.find('.sample').text();
          console.log((index + 1) + ". " + exp);
          return console.log("    " + sample);
        });
      });
    });
  }, function() {
    if (!argv.rank) {
      return false;
    }
    return request("http://dict.chunghe.me/rank/" + q, function(error, rsp, body) {
      body = JSON.parse(body);
      return console.log("rank: #" + body.rank);
    });
  }
]);

