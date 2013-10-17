
http = require 'http'
request = require 'request'
fs = require 'fs'
child_process = require 'child_process'
http = require 'http'
exec = child_process.exec


cheerio = require 'cheerio'
argv = require('optimist')
  .usage('command line interface for tw.dictionary.yahoo.com')
  .alias('s', 'speak')
  .describe('speak the word')
  .argv

# And non-hypenated options too! Just use argv._!
q = argv.speak || argv._[0]
if not q
  console.log 'please sepcify keyword'
  process.exit(1)


#url = 'http://tw.dictionary.yahoo.com/dictionary?p=amateur'
url = "http://tw.dictionary.search.yahoo.com/search?p=#{q}&fr2=dict"
sound_local = "/tmp/#{q}.mp3"
file = fs.createWriteStream(sound_local)

speak = (sound_url) ->
  request = http.get(sound_url, (rsp) ->
    rsp.on('data', (data) ->
      #fs.writeFile("#{sound_local}", data)
      file.write(data)
    )
    rsp.on('end', ->
      file.end()
      exec("afplay #{sound_local}")
    )
  )

request(url, (error, rsp, body) ->
  $ = cheerio.load(body)
  data = []
  word = $('.title_term .yschttl').text()
  console.log word
  $pronun = $('.proun_wrapper')
  sound_url = $pronun.find('.proun_sound a').attr('href')
  speak(sound_url) if sound_url and argv.speak

  console.log $pronun.text()
  $sections = $('.result_cluster_first .explanation_pos_wrapper')
  $sections.each( (i, section) ->
    $section = $(section)
    $hd = $section.find('.explanation_group_hd')
    abbr = $hd.find('.pos_abbr').text()
    desc = $hd.find('.pos_desc').text()
    $exp_item = $section.find('.explanation_ol li')
    console.log "#{abbr}  #{desc}"
    $exp_item.each( (index, item) ->
      $item = $(item)
      exp = $item.find('.explanation').text()
      sample = $item.find('.sample').text()
      console.log "#{index+1}. #{exp}"
      console.log "    #{sample}"
    )
  )
)
