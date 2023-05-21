import {Collection} from "mongodb";

//experimental
export default class StoreMongo {
    private readonly docFilter: {id: string} //_id as string not working for some reason, tho it should be supported
    private readonly routeString: string
    private readonly commonProjection

    constructor(
        readonly client: Collection,
        readonly id: string,
        readonly route: string[] = [],
        private encode = a => a,
        private decode = a => a
    ) {
        this.docFilter = {id}
        this.routeString = this.route.join('.')
        this.commonProjection = {_id: 0}
        if(this.routeString) this.commonProjection[this.routeString] = 1
        else this.commonProjection.id = 0
    }

    private getRouteString = (key: string) => this.routeString ? this.routeString + '.' + key : key

    col = (...args: string[]) => new StoreMongo(
        this.client, this.id, [...this.route, ...args],
        this.encode, this.decode
    )

    set = (key: string, value: any): Promise<number> => {
        return this.client.findOneAndUpdate(this.docFilter, {
            $set: {[this.getRouteString(key)]: this.encode(value)}
        }, {upsert: true}).then(r => r.ok)
    }

    seto = (object: { [key: string]: any }) => {
        const fullObjectKeys = {}
        for(const key in object)
            fullObjectKeys[this.getRouteString(key)] = this.encode(object[key])
        return this.client.findOneAndUpdate(this.docFilter, {
            $set: fullObjectKeys
        }, {upsert: true}).then(r => r.ok)
    }

    setm = (args: [k: string, v: any][]) => this.seto(Object.fromEntries(args))

    get = async (key: string) => {
        let res = await this.client.findOne(this.docFilter, {projection: this.commonProjection})
        for(const p of [...this.route, key]) {
            if(!res) break
            if(typeof res !== 'object') throw new Error('bad value')
            res = res[p]
        }
        return this.decode(res)
    }

    //as i can understand there's no way to limit the nesting, so redis and fs store
    //needs to be updated to support retrieving nested docs for results consistency 🤡
    //or just filter out nested values from this results which seems really dumb
    geta = async (assignTo?: {[key: string]: any}) => {
        let res = await this.client.findOne(this.docFilter, {projection: this.commonProjection})
        for(const p of this.route) {
            if(!res) break
            if(typeof res !== 'object') throw new Error('bad value')
            res = res[p]
        }
        for(const k in res) { //i don't know what to do with nested objects
            res[k] = this.decode(res[k])
        }
        return res || {}
    }

    //nobrainer
    getm = (keys: string[]) => {
        return this.geta().then(r => {
            if(r === null) return r
            return keys.map(k => this.decode(r[k]))
        })
    }

    del = (key: string) => {
        return this.client.updateOne(this.docFilter, {
            $unset: {[this.getRouteString(key)]: 1}
        }).then(r => r.modifiedCount)
    }

    dela = () => {
        if(!this.routeString) { //we're in root – delete doc
            return this.client.findOneAndDelete(this.docFilter)
                .then(r => r.ok)
        } else {
            return this.client.updateOne(this.docFilter, {
                $unset: {[this.routeString]: 1}
            }).then(r => r.modifiedCount)
        }
    }

    delm = (keys: string[]) => {
        const $unset = {}
        for(const a of keys) $unset[this.getRouteString(a)] = 1
        return this.client.updateOne(this.docFilter, {$unset})
    }

    itk() {}
    itkv() {}

}