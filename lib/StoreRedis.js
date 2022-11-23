import {getLastArg, transformObjectValues, valuesToObject} from "./utils.js";

export default class StoreRedis {
  constructor(client, base = '') {
    this.client = client
    this.base = base
    this.sep = ':'
  }

  encode = JSON.stringify
  decode = JSON.parse

  getPath(args, offset = 0) {
    let path = this.base
    for(let i = 0; i <= args.length - 1 - offset; i++) path += this.sep + args[i]
    return path
  }

  get() {
    const lastArg = getLastArg(arguments)
    return (typeof lastArg === "string"
      ? this.client.hgetall(this.getPath(arguments))
      : this.client.hmget(this.getPath(arguments, 1), lastArg)
          .then(V => valuesToObject(lastArg, V)))
      .then(O => transformObjectValues(this.decode, O))
  }

  set() {
    const data = transformObjectValues(this.encode, getLastArg(arguments))
    return this.client.hmset(this.getPath(arguments, 1), ...Object.entries(data))
  }

  del() {
    const lastArg = getLastArg(arguments)
    if(Array.isArray(lastArg)) return this.client.hdel(this.getPath(arguments, 1), ...lastArg)
    else return this.client.del(this.getPath(arguments))
  }

}