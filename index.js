#!/usr/bin/env/node

const { start, shutdown } = require('live-server')
const Path = require('path')
const chokidar = require('chokidar')
const sass = require('sass')
const pug = require('pug')
const fs = require('fs')
const { WindowsToaster } = require('node-notifier')
let watcher = chokidar.watch(Path.resolve(process.cwd()), { ignored: /(^|[\/\\])\../ })
let notifier = new WindowsToaster({
  withFallback: false,
  customPath: void 0
})
let options = {
  cores: true,
  port: 8080,
  ignore: ['node_modules/'],
  wait: 1000
}
watcher.on('change', path => {
  path = Path.resolve(path)
  render(path)
})
function notifySth () {
  this.id = 0
}
notifySth.prototype.call = function (title = '', msg = '') {
  notifier.notify({
    title: title,
    message: msg,
    sound: true,
    wait: false,
    id: this.id++,
    appID: void 0
  }, function (error, response) {
    console.log(error)
    console.log(response)
  })
}
let _n = new notifySth()
function render (path) {
  if (path && /\.jade$/.test(path)) {
    try {
      fs.writeFileSync(path.replace(/\.jade$/, '.html'), pug.renderFile(path), { encoding: 'utf8' })
    } catch (error) {
      _n.call('Error for jade/pug compile', error)
    }
  }
  if (path && /(\.scss|\.sass)$/.test(path)) {
    sass.render({
      file: path,
      outFile: Path.resolve(path).replace(/(scss|sass)$/, 'css'),
      sourceMap: true,
      atomic: false
    }, function (err, result) {
      if (err) {
        console.log(err)
        _n.call(err.file, err.formatted)
      }
      else fs.writeFileSync(path.replace(/(\.scss|\.sass)$/, '.css'), result.css.toString(), { encoding: 'utf8' })
    })
  }
}
if (!module.parent) {
  start(options)
  process.on('SIGINT', () => {
    watcher.close()
    shutdown()
  })
  if ('--all -a'.includes(process.argv[2])) {
    let ignore = /(^\..+|node_modules)/
    let _recurve = (path, parent = Path.dirname(process.cwd())) => {
      path = Path.resolve(parent, path)
      if (ignore.test(path)) return false
      if (fs.lstatSync(path).isDirectory()) fs.readdirSync(path, 'utf8').forEach(f => _recurve(f, path))
      else render(path)
    }
    fs.readdirSync(Path.dirname(process.cwd()), 'utf8').forEach(r => {
      try {
        _recurve(r)
      } catch (error) {
        console.log(error)
      }
    })
  }
}

module.exports = {
  start () {
    start(options)
  },
  close () {
    shutdown()
    watcher.close()
  }
}