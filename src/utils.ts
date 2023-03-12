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