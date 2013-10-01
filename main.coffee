
http = require 'http'
request = require 'request'
fs = require 'fs'
child_process = require 'child_process'
http = require 'http'
exec = child_process.exec
cheerio = require 'cheerio'

q = process.argv[2]
if not q
  console.log 'please sepcify keyword'


#url = 'http://tw.dictionary.yahoo.com/dictionary?p=amateur'
url = "http://tw.dictionary.search.yahoo.com/search?p=#{q}&fr2=dict"
console.log q
sound_name = "#{q}.mp3"

speak = (sound_url) ->
  request = http.get(sound_url, (rsp) ->
    rsp.on('data', (data) ->
      fs.writeFile(sound_name, data)
    )
    rsp.on('end', ->
      exec("afplay #{sound_name}")
    )
  )

request(url, (error, rsp, body) ->
  $ = cheerio.load(body)
  data = []
  $pronun = $('.proun_wrapper')
  sound_url = $pronun.find('.proun_sound a').attr('href')
  speak(sound_url)

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
