import {PersistormInstance, StoreFS} from "./index";
import {MongoClient} from "mongodb";
import StoreMongo from "./Stores/StoreMongo";
import Redis from "ioredis";
import StoreRedis from "./Stores/StoreRedis";

export const fromEnv = (variations: readonly string[], defaultValue: string): string => {
  for(const v of variations)
    if(typeof process.env[v] === 'string')
      return process.env[v] as string //are you dummy???
  return defaultValue
}

export const envPrefix = process.env.PERSISTORM_PREFIX || ''
// todo: allow lower
// todo: allow ditching provider prefix
// todo: custom env keys and passing priority opts to getStoreFromEnv
// todo: encoding env (may just be simple pass for cryptowrap or location) if i decide to continue using it.
export const envKeys = {
  provider: [[envPrefix+'PROVIDER'], ''],
  mongo: {
    url: [[envPrefix+'MONGO_URL'], 'mongodb://localhost:27017/persistorm'],
    col: [[envPrefix+'MONGO_COL'], 'default']
  },
  redis: {
    url: [[envPrefix+'REDIS_URL'], 'redis://localhost:6379/0'],
    sep: [[envPrefix+'REDIS_SEP'], ':'],
    route: [[envPrefix+'REDIS_ROUTE'], '_ps']
  },
  fs: {
    root: [[envPrefix+'FS_ROOT'], StoreFS.tmp],
    ext: [[envPrefix+'FS_EXT'], '.json']
  }
} as const


export const getStoreFromEnv = (): PersistormInstance | null => {
  const provider = fromEnv(...envKeys.provider)

  switch (provider) {
    case 'mongo': {
      const url = fromEnv(...envKeys.mongo.url)
      const colName = fromEnv(...envKeys.mongo.col)
      const client = new MongoClient(url)
      const collection = client.db().collection(colName)
      return new StoreMongo(client, collection)
    }
    case 'fs': {
      const root = fromEnv(...envKeys.fs.root)
      const ext = fromEnv(...envKeys.fs.ext)
      return new StoreFS(root, [], ext)
    }
    case 'redis': {
      const url = fromEnv(...envKeys.redis.url)
      const sep = fromEnv(...envKeys.redis.sep)
      const route = fromEnv(...envKeys.redis.route)
      const redis = new Redis(url)
      return new StoreRedis(redis, [route], sep)
    }
    default:
      return null
  }
}