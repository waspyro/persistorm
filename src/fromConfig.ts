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
// todo: encoding env (may just be simple pass for cryptowrap or location) if i decide to continue using it.
// todo: redis empty route, and split
// todo: fs route
export const envKeys = {
  provider: [[envPrefix+'PROVIDER'], ''],
  mongo: {
    url: [[envPrefix+'MONGO_URL'], 'mongodb://localhost:27017/persistorm'],
    col: [[envPrefix+'MONGO_COL'], 'default'],
    route: [[envPrefix+'MONGO_ROUTE'], '']
  },
  redis: {
    url: [[envPrefix+'REDIS_URL'], 'redis://localhost:6379/0'],
    sep: [[envPrefix+'REDIS_SEP'], ':'],
    route: [[envPrefix+'REDIS_ROUTE'], '_ps'],
  },
  fs: {
    root: [[envPrefix+'FS_ROOT'], StoreFS.tmp],
    ext: [[envPrefix+'FS_EXT'], '.json']
  }
} as const

type ObjectValuesAsString <T> = {
  [K in keyof T]?: T[K] extends readonly [any, any]
    ? string : T[K] extends Record<string, any>
      ? ObjectValuesAsString<T[K]> : string;
}

export type StoreConfig = ObjectValuesAsString<typeof envKeys>

export const getStoreFromConfig = (config: StoreConfig = {}): PersistormInstance | null => {
  const provider = config.provider || fromEnv(...envKeys.provider)

  switch (provider) {
    case 'mongo': {
      const url = config.mongo?.url || fromEnv(...envKeys.mongo.url)
      const colName = config.mongo?.col || fromEnv(...envKeys.mongo.col)
      const route = (config.mongo?.route || fromEnv(...envKeys.mongo.route)).split(',')
      const client = new MongoClient(url)
      const collection = client.db().collection(colName)
      return new StoreMongo(client, collection, route)
    }
    case 'fs': {
      const root = config.fs?.root || fromEnv(...envKeys.fs.root)
      const ext = config.fs?.ext || fromEnv(...envKeys.fs.ext)
      return new StoreFS(root, [], ext)
    }
    case 'redis': {
      const url = config.redis?.url || fromEnv(...envKeys.redis.url)
      const sep = config.redis?.sep || fromEnv(...envKeys.redis.sep)
      const route = config.redis?.route || fromEnv(...envKeys.redis.route)
      const redis = new Redis(url)
      return new StoreRedis(redis, [route], sep)
    }
    default:
      return null
  }
}