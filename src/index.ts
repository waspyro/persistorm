import StoreFS from './Stores/StoreFS'
import StoreRedis from "./Stores/StoreRedis";
import StoreMongo from "./Stores/StoreMongo";
import {getStoreFromEnv} from "./env";

export { StoreFS, StoreRedis, StoreMongo, getStoreFromEnv as FromEnv}
export type PersistormInstance = StoreFS | StoreRedis | StoreMongo

//todo: memory
//todo: rest | socket | websocket with builtin server implementation
//support for '..' col calls