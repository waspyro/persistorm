export const ObjectDecoder = decoder => O => {
    for(const key in O) O[key] = decoder(O[key])
    return O
}

export const ArrayDecoder = decoder => A => A.map(el => decoder(el))
