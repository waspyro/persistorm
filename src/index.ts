import StoreFS from './Stores/StoreFS'
import StoreRedis from "./Stores/StoreRedis";

export {StoreFS, StoreRedis}
export type PersistormInstance = StoreFS | StoreRedis