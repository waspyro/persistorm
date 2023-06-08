import {PersistormInstance} from "./index";

export const ObjectDecoder = decoder => assignTo => O => {
    if(!assignTo) assignTo = O
    for(const key in O) assignTo[key] = decoder(O[key])
    return O
}

export const ArrayDecoder = decoder => A => A.map(el => decoder(el))

export const countTruthy = (arr: any[]) => {
    let truthy = 0
    for(let i = 0; i < arr.length; i++) if(arr[i]) truthy++
    return truthy
}

export const commonGetSet = async function<T extends any>(
  this: PersistormInstance, key: string,
  setter: (key: string, ctx: typeof this) => T,
  setCondition = v => !v
): Promise<T> {
    let value = await this.get(key)
    if(setCondition(value)) {
        value = await setter(key, this)
        await this.set(key, value)
    }
    return value
}