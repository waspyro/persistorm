import StoreFS from './Stores/StoreFS'
import StoreRedis from "./Stores/StoreRedis";
import StoreMongo from "./Stores/StoreMongo";

export {StoreFS, StoreRedis}
export type PersistormInstance = StoreFS | StoreRedis | StoreMongo