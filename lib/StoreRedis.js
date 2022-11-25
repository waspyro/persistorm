import {decodeArr, decodeObject, getLastArg, objectToArray, transformObjectValues, valuesToObject} from "./utils.js";

export default class StoreRedis {
  #base; #client; #encode; #decode; #sep

  constructor(client, path = ['default'], {sep = ':', encode = JSON.stringify, decode = JSON.parse} = {}) {
    this.#client = client
    this.#base = path.join(sep)
    this.#encode = encode
    this.#decode = decode
    this.#sep = sep
  }

  col() {
    return new StoreRedis(this.#client, [this.#base, ...arguments], {
      sep: this.#sep, encode: this.#encode, decode: this.#decode
    })
  }

  set() {
    if(typeof arguments[0] === 'string') return this.#client.hset(this.#base, arguments[0], this.#encode(arguments[1]))
    if(!Array.isArray(arguments[0])) arguments[0] = Object.entries(arguments[0]).flat()
    for(let i = 1; i < arguments[0].length; i += 2) arguments[0][i] = this.#encode(arguments[0][i])
    return this.#client.hmset(this.#base, ...arguments[0])
  }

  get() {
    if(!arguments[0]) return this.#client.hgetall(this.#base).then(decodeObject(this.#decode))
    if(typeof arguments[0] === 'string') return this.#client.hget(this.#base, arguments[0]).then(this.#decode)
    return this.#client.hmget(this.#base, arguments[0]).then(decodeArr(this.#decode))
  }

  del() {
    if(!arguments[0]) return this.#client.del(this.#base)
    return this.#client.hdel(this.#base, ...arguments)
  }

}