import Redis from "ioredis";
import {ArrayDecoder, ObjectDecoder} from "../utils";

export default class StoreRedis {
    readonly path: string
    private readonly arrayDecoder
    private readonly objectDecoder

    constructor(
        readonly client: Redis,
        route: string[] = ['_persist'],
        readonly sep: string = ':',
        private encode = JSON.stringify,
        private decode = JSON.parse
    ) {
        this.path = route.filter(el => el).join(sep)
        this.arrayDecoder = ArrayDecoder(this.decode)
        this.objectDecoder = ObjectDecoder(this.decode)
    }

    col = (...args: string[]) => new StoreRedis(
        this.client, [this.path, ...args],
        this.sep, this.encode, this.decode
    )

    set = (...args: (string|string[])[]) => {
        if(typeof args[0] === 'string')
            return this.client.hset(this.path, args[0], this.encode(args[1]))
        if(Array.isArray(args[0]))
            args[0] = Object.entries(args[0]).flat()
        for(let i = 1; i < args[0].length; i += 2)
            args[0][i] = this.encode(args[0][i])
        return this.client.hmset(this.path, ...args)
    }

    get = (...args: string[]) => {
        if(!args.length) return this.client
            .hgetall(this.path).then(this.objectDecoder)
        if(typeof args[0] === 'string') return this.client
            .hget(this.path, args[0]).then(this.decode)
        return this.client
            .hmget(this.path, args[0]).then(this.arrayDecoder)
    }

    del = (...args: string[]) => {
        if(!args.length) return this.client.del(this.path)
        return this.client.hdel(this.path, ...args.flat())
    }

}
