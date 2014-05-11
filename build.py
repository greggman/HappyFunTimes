#!/usr/bin/python
# Copyright 2012, Gregg Tavares.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Gregg Tavares. nor the names of his
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import glob
import os
import re
import sys
from optparse import OptionParser


class Builder(object):

  def __init__ (self):
    self.file_db = {}
    self.articles = []

  def ReadFile(self, file_name):
    if file_name in self.file_db:
      return self.file_db[file_name]
    f = open(file_name, "rb")
    content = f.read().decode('utf-8-sig')
    f.close()
    self.file_db[file_name] = content
    return content


  def WriteFileIfChanged(self, file_name, content):
    if os.path.exists(file_name):
      old = self.ReadFile(file_name)
      if content == old:
        return
    f = open(file_name, "wb")
    f.write(content.encode('utf8'))
    f.close()
    print "Wrote: ", file_name


  def ExtractHeader(self, content):
    lines = content.splitlines()
    meta_data = {}
    while True:
      line = lines[0]
      m = re.match('([A-Z0-9_-]+): (.*)$', line, re.IGNORECASE)
      if not m:
        break
      meta_data[m.group(1).lower()] = m.group(2)
      lines.pop(0)
    return ("\n".join(lines), meta_data)


  def LoadFile(self, file_name):
    content = self.ReadFile(file_name)
    return self.ExtractHeader(content)

  def EscapeSubstitutions(str, extra):
    str = str.replace('%(', '__STRING_SUB__')
    str = str.replace('%', '__PERCENT__')
    str = str.replace('__STRING_SUB__', '%(')
    str = str % extra
    str = str.replace('__PERCENT__', '%')

  def ApplyTemplate(self, template_path, params):
    template = self.ReadFile(template_path)
    return template % params

  def ApplyTemplateToString(self, template_path, out_file_name, params):
    template = self.ReadFile(template_path)
    output = template % params
    self.WriteFileIfChanged(out_file_name, output)

  def ApplyTemplateToFile(self, template_path, content_file_name, out_file_name, extra = {}):
    print "processing: ", content_file_name
    (content, meta_data) = self.LoadFile(content_file_name)
    ##print meta_data
    meta_data['content'] = content
    meta_data['src_file_name'] = content_file_name
    meta_data['dst_file_name'] = out_file_name
    for key in extra:
      meta_data[key] = extra[key]
    self.ApplyTemplateToString(template_path, out_file_name, meta_data)
    self.articles.append(meta_data)

  def ApplyTemplateToFiles(self, template_path, files_spec):
    file_names = glob.glob(files_spec)
    for file_name in file_names:
      (base_name, etc) = os.path.splitext(file_name)
      out_file_name = base_name + ".html"
      self.ApplyTemplateToFile(template_path, file_name, out_file_name, )

  def Process(self):
    examples = [
      { "useGameTemplate": True,  "name": "BoomBoom",              "gameId": "boomboom", },
      { "useGameTemplate": False, "name": "DeviceOrientation",     "gameId": "orient", },
      { "useGameTemplate": True,  "name": "JamJam",                "gameId": "jamjam", },
      { "useGameTemplate": True,  "name": "JumpJump",              "gameId": "jumpjump", },
      { "useGameTemplate": False, "name": "PowPow",                "gameId": "powpow", },
      { "useGameTemplate": True,  "name": "ShootShoot",            "gameId": "shootshoot", },
      { "useGameTemplate": False, "name": "UnityCharacterExample", "gameId": "unitycharacterexample", },
      { "useGameTemplate": False, "name": "Simple",                "gameId": "simple", },
      { "useGameTemplate": False, "name": "SuperSimple",           "gameId": "supersimple", },
      { "useGameTemplate": False, "name": "ClockSync",             "gameId": "clocksync", },
    ]
    menuParts = []
    for example in examples:
      name = example["name"]
      filebasename = name.lower()
      dirname = os.path.join("public", "examples", filebasename)
      example["filebasename"] = filebasename
      menuParts.append(self.ApplyTemplate("templates/menu.item.html", example))

      if example["useGameTemplate"]:
        gameview_src_name = os.path.join(dirname, "game.html")
        gameview_dst_name = os.path.join(dirname, "gameview.html")
        self.ApplyTemplateToFile("templates/game.gameview.html", gameview_src_name, gameview_dst_name, example)

      index_src_name = os.path.join(dirname, "controller.html")
      index_dst_name = os.path.join(dirname, "index.html")
      self.ApplyTemplateToFile("templates/controller.index.html", index_src_name, index_dst_name, example)

    self.ApplyTemplateToString("templates/menu.index.html", "public/index.html", {
      "content": "\n".join(menuParts)
    })


def main (argv):
  parser = OptionParser()
  parser.add_option(
      "-v", "--verbose", action="store_true",
      help="prints more output.")
  parser.add_option(
      "-d", "--debug", action="store_true",
      help="turns on debugging.")

  (options, args) = parser.parse_args(args=argv)

  b = Builder()
  b.Process()


if __name__ == '__main__':
  main(sys.argv[1:])

