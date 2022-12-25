import {mkdirP} from "mkdirp";
import Path from 'path'
const join = Path.join
import fs from 'fs/promises'
import os from 'os'

export default class StoreFS {
  #base; #ext; #encode; #decode
  constructor(base = [os.tmpdir(), 'store_fs_temp'], {ext = '.json', encode = JSON.stringify, decode = JSON.parse} = {}) {
    this.#base = join(...base)
    this.#ext = ext
    this.#encode = encode
    this.#decode = decode
    return this
  }

  init() {
    return mkdirP(this.#base).then(() => this)
  }

  #getFullFilePath(name, ext = this.#ext) {
    return join(this.#base, name) + ext
  }

  #readFile(name) {
    return fs.readFile(this.#getFullFilePath(name), 'utf-8')
      .then(this.#decode).catch(() => null)
  }

  #writeFile(name, content) {
    return fs.writeFile(this.#getFullFilePath(name), this.#encode(content)).then(() => 'OK')
  }

  #getFilesInFolder() {
    return fs.readdir(this.#base)
      .then(files => files.filter(file => file.endsWith(this.#ext)))
  }

  #readWholeFolder() {
    return this.#getFilesInFolder().then(files => {
      return Promise.all(files.map(file => {
        const name = Path.parse(file).name
        return this.#readFile(name).then(value => [name, value])
      })).then(Object.fromEntries).catch(() => Object())
    })
  }

  #readSpecificFiles(filenames) {
    return Promise.all(filenames.map(name => this.#readFile(name)))
  }

  col(...name) {
    return new StoreFS([this.#base, ...name], {ext: this.#ext, encode: this.#encode, decode: this.#decode})
  }

  set() {
    if(typeof arguments[0] === 'string') return this.#writeFile(arguments[0], arguments[1])
    if(!Array.isArray(arguments[0])) arguments[0] = Object.entries(arguments[0])
    else if(!Array.isArray(arguments[0][0])) {
      const entries = []
      for(let i = 0; i <= arguments[0].length; i += 2)
        entries.push(arguments[0][i], arguments[i+1])
      arguments[0] = entries
    }
    return Promise.all(arguments[0].map(el => this.#writeFile(el[0], el[1])))
      .then(res => res.some(el => el !== 'OK') ? 'NOK' : 'OK') //NOK?
  }

  get() {
    if(!arguments[0]) return this.#readWholeFolder()
    if(typeof arguments[0] === 'string') return this.#readFile(arguments[0])
    return this.#readSpecificFiles(...arguments)
  }

  del() {
    if(!arguments[0]) return this.#getFilesInFolder()
      .then(files => { //should also delete self if parent have no files
        if(!files.length) return 0
        else return Promise.all(files.map(file => fs.unlink(this.#getFullFilePath(file, ''))))
          .then(() => 1)
      })
    return Promise.all(Array.from(arguments)
      .map(filename => fs.unlink(this.#getFullFilePath(filename))
        .catch(e => 0).then(() => 1))) //todo return 0 in not deleted...
      .then(results => results.reduce((a,b) => a + b, 0))
  }

  fill(keys) {
    Promise.all(keys.map((el, i) => this.#readFile(el).then(data => keys[i] = data))).then(() => keys)
  }

}