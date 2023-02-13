import Redis from "ioredis";
import {ArrayDecoder, ObjectDecoder} from "../utils";

export default class StoreRedis {
    readonly path: string
    private readonly arrayDecoder
    private readonly objectDecoder

    constructor(
        readonly client: Redis,
        route: [string, ...string[]] = ['_persist'],
        readonly sep: string = ':',
        private encode = JSON.stringify,
        private decode = JSON.parse
    ) {
        if(!sep.length) throw new Error('sep cannot be empty string')
        this.path = route.filter(el => el).join(sep)
        this.arrayDecoder = ArrayDecoder(this.decode)
        this.objectDecoder = ObjectDecoder(this.decode)
    }

    col = (...args: string[]) => new StoreRedis(
        this.client, [this.path, ...args],
        this.sep, this.encode, this.decode
    )

    set = (key, value) =>
        this.client.hset(this.path, key, this.encode(value))
    seto = (...args: { [key: string]: any }[]) =>
        this.setm(...args.map(Object.entries).flat())
    setm = (...args: any[]) =>
        this.client.hmset(this.path, ...args.flat()
        .map((e, i) => i % 2 ? this.encode(e) : e)) //encode all the values

    get = (key: string) =>
        this.client.hget(this.path, key).then(this.decode)
    geta = () =>
        this.client.hgetall(this.path).then(this.objectDecoder)
    getm = (...args: [string, ...string[]] | [[string, ...string[]]]) =>
        this.client.hmget(this.path, ...args.flat()).then(this.arrayDecoder)

    del = (key) =>
        this.client.del(this.path, key)
    dela = () =>
        this.client.del(this.path)
    delm = (...args) =>
        this.client.hdel(this.path, ...args)

}
