import {mkdirP} from "mkdirp";
import Path from 'path'
const join = Path.join
import fs from 'fs/promises'
import {getLastArg} from "./utils.js";

export default class StoreFS {
  constructor(base = '/tmp/store') {
    this.base = base
    this.ext = '.json'
    return this.#init()
  }

  #init() {
    return mkdirP(this.base).then(() => this)
  }

  encode = JSON.stringify
  decode = JSON.parse

  #readFile(path) {
    return fs.readFile(path, 'utf-8')
      .then(this.decode).catch(() => null)
  }

  #writeFile(path, content) {
    return fs.writeFile(path, this.encode(content)).then(() => 'OK')
  }

  getPath(args, offset = 0) {
    let path = this.base
    for(let i = 0; i <= args.length - 1 - offset; i++)
      path = join(path, args[i])
    return path
  }

  #readWholeFolder(path) {
    return fs.readdir(path).then(files => {
      const dataFiles = files.filter(e => e.endsWith(this.ext))
      return Promise.all(dataFiles
        .map(file => this.#readFile(join(path, file)).then(value => [Path.parse(file).name, value])))
        .then(Object.fromEntries)
    })
  }

  #readSpecificFiles(path, filenames) {
    return Promise.all(filenames.map(name => this.#readFile(join(path, name) + this.ext)
      .then(value => [name, value])))
      .then(Object.fromEntries)
  }

  get() {
    const lastArg = getLastArg(arguments)
    if (typeof lastArg === 'string')
      return this.#readWholeFolder(this.getPath(arguments)).catch(() => Object())
    return this.#readSpecificFiles(this.getPath(arguments, 1), lastArg)
  }

  #mkdirknown = {}
  #mkdir = (path) => mkdirP(path).then(() => this.#mkdirknown[path] = 1)

  set() {
    const path = this.getPath(arguments, 1)
    if(!this.#mkdirknown[path])
      return this.#mkdir(path).then(() => this.set(...arguments))
    const content = getLastArg(arguments)
    const ops = Object.keys(content).map(filename => {
      const file = join(path, filename + this.ext)
      return this.#writeFile(file, content[filename])
    })
    return Promise.all(ops)
      .then(res => res.some(el => el !== 'OK') ? 'NOK' : 'OK') //NOK?
  }

  del() {
    const filenames = getLastArg(arguments)
    if(typeof filenames === 'string')
      return fs.rm(this.getPath(arguments), {recursive: true})
        .then(() => 1).catch(() => 0)
    const path = this.getPath(arguments, 1)
    const ops = filenames.map(name => fs.rm(join(path, name + this.ext)))
    return Promise.all(ops)
  }

}