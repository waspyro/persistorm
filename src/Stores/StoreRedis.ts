import Redis from "ioredis";
import {ArrayDecoder, commonGetSet, ObjectDecoder} from "../utils";

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

    set = (key: string, value: any): Promise<number> =>
        this.client.hset(this.path, key, this.encode(value))

    setm = (args: [k: string, v: any][]) =>
        this.client.hmset(this.path, args
            .map((e, i) => i % 2 ? this.encode(e) : e))

    seto = (object: { [key: string]: any }) =>
        this.setm(Object.entries(object))

    get = (key: string) =>
        this.client.hget(this.path, key).then(this.decode)

    geta = (assignTo: undefined | {[key: string]: any}) =>
        this.client.hgetall(this.path).then(this.objectDecoder(assignTo))

    getm = (keys: string[]): Promise<(any | null)[]> =>
        this.client.hmget(this.path, ...keys).then(this.arrayDecoder)

    del = (key) =>
        this.client.del(this.path, key)

    dela = () =>
        this.client.del(this.path)

    delm = (keys: string[]) =>
        this.client.hdel(this.path, ...keys)

    getset: typeof commonGetSet = commonGetSet.bind(this)

}
