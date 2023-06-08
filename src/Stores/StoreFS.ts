import os from 'os'
import Path from 'path'
import fs from 'fs/promises'
import {mkdirp} from 'mkdirp'
import {commonGetSet, countTruthy} from "../utils";

export default class StoreFS {

    readonly path: string
    readonly root: string
    readonly route: string[]

    constructor(
        root = StoreFS.tmp,
        route: string | string[] = [],
        readonly ext = '.json',
        private encode: (valueToEncode: any) => string = JSON.stringify,
        private decode: (valueToDecode: string) => any = JSON.parse
    ) {
        if(typeof route === 'string') route = [route]
        this.root = root
        this.path = Path.join(root, ...route)
        this.route = route
    }

    col = (...args: string[]) => new StoreFS(
        this.root, [...this.route, ...args],
        this.ext, this.encode, this.decode
    )

    #genFullPath = (key, ext = '') => Path.join(this.path, key) + ext

    #onDirCreated: ((err)=>void)[] = []
    #createDir = () => new Promise<void>((resolve, reject) => {
        if(this.#onDirCreated.push((err) => err ? reject(err) : resolve()) !== 1) return;
        mkdirp(this.path, (err) => {
            for(const l of this.#onDirCreated) l(err)
            this.#onDirCreated.length = 0
        })
    })

    #write = (filename, encodedValue) => fs.writeFile(filename, encodedValue)
        .then(() => 1)
        .catch((e) => {
            if(e.code !== 'ENOENT') throw e
            return this.#createDir()
                .then(() => this.#write(filename, encodedValue))
        })

    set = (key: string, value: any): Promise<1> => //todo: Parameters<typeof this.encode>[0]
        this.#write(this.#genFullPath(key, this.ext), this.encode(value))

    seto = (object: { [key: string]: any }) =>
        this.setm(Object.entries(object))

    setm = (args: [k: string, v: any][]) =>
        Promise.all(args.map(([k, v]) => this.set(k, v)))


    #readFile = (fullFilePath: string) => fs.readFile(fullFilePath, "binary")
        .then(this.decode).catch(() => null)

    #isFile = (name) => name.endsWith(this.ext)

    //we can check for fs.access and staff but i think this is overkill for simple project like that
    #getFolderContent = (path = this.path) => fs.readdir(path)
        .then(content => {
            const filesAndDirs: [string[], string[]] = [[], []]
            for(const c of content) filesAndDirs[Number(!this.#isFile(c))].push(c)
            return filesAndDirs
        })

    #getFilesInPath = () => this.#getFolderContent().then(r => r[0])


    get = (key: string) => this.#readFile(this.#genFullPath(key, this.ext))

    geta = async (assignTo = {}) => {
        try {
            const filenames = await this.#getFilesInPath()
            await Promise.all(filenames.map(filename =>
                this.#readFile(this.#genFullPath(filename))
                    .then(data => assignTo[Path.parse(filename).name] = data)))
        } finally {
            return assignTo
        }
    }

    getm = (keys: string[]):  Promise<(any | null)[]> =>
        Promise.all(keys.map(this.get))

    #deleteFile = fullFilePath =>
        fs.unlink(fullFilePath)
            .then(() => 1)
            .catch(() => 0)

    #deleteFiles = files =>
        Promise.all(files.map(f => this.#genFullPath(f)).map(this.#deleteFile))

    #deleteEmptyDirs = dirs =>
        Promise.all(dirs.map(dir =>
            fs.rmdir(Path.join(this.path, dir))
                .catch(() => null)
        ))

    del = (key) => this.#deleteFile(this.#genFullPath(key, this.ext))

    dela = () => this.#getFolderContent().then(([files, dirs]) => {
        const promises: Promise<any>[]  = []
        if(files.length) promises.push(this.#deleteFiles(files))
        if(dirs.length) promises.push(this.#deleteEmptyDirs(dirs))
        if(promises.length) return Promise.all(promises).then(() => 1)
        return Number(!!promises.length)
    })

    delm = (keys: string[]) => this.#deleteFiles(keys.map(el => el + this.ext)).then(countTruthy)

    getset: typeof commonGetSet = commonGetSet.bind(this)

    static home = os.homedir()
    static tmp = Path.join(os.tmpdir(), 'persistorm')
    static local = Path.join(StoreFS.home, '.local', 'state', 'persistorm') //dono for win
    static env = process.env.PERSISTORM_DIR
    static default = StoreFS.env || StoreFS.tmp
}