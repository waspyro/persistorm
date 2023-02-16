export const ObjectDecoder = decoder => assignTo => O => {
    if(!assignTo) assignTo = O
    for(const key in O) assignTo[key] = decoder(O[key])
    return O
}

export const ArrayDecoder = decoder => A => A.map(el => decoder(el))
