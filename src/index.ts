import StoreFS from './Stores/StoreFS'
import StoreRedis from "./Stores/StoreRedis";
import StoreMongo from "./Stores/StoreMongo";
import {getStoreFromConfig} from "./fromConfig";

export { StoreFS, StoreRedis, StoreMongo, getStoreFromConfig as FromConfig}
export type PersistormInstance = StoreFS | StoreRedis | StoreMongo

//todo: sqlite
//todo: memory
//todo: rest | socket | websocket with builtin server implementation
//todo: support for '..' col calls