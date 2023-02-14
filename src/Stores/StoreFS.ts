import os from 'os'
import Path from 'path'
import fs from 'fs/promises'
import mkdirp from 'mkdirp'

export default class StoreFS {

    readonly path: string
    readonly root: string
    readonly route: string[]

    constructor(
        root = StoreFS.tmp,
        route: string | string[] = [],
        readonly ext = '.json',
        private encode = JSON.stringify,
        private decode = JSON.parse
    ) {
        if(typeof route === 'string') route = [route]
        this.path = Path.join(root, ...route)
    }

    col = (...args: string[]) => new StoreFS(
        this.root, [...this.route, ...args],
        this.ext, this.encode, this.decode
    )

    #genFullPath = (key, ext = '') => Path.join(this.path, key) + ext

    #write = (filename, encodedValue) => fs.writeFile(filename, encodedValue)
        .then(() => 1)
        .catch((e) => {
            if(e.code !== 'ENOENT') throw e
            return mkdirp(this.path)
                .then(() => this.#write(filename, encodedValue))
        })

    set = (key: string, value: any) =>
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

    geta = () => this.#getFilesInPath()
        .then(filenames => Promise.all(filenames
            .map(async filename => [
                Path.parse(filename).name,
                await this.#readFile(this.#genFullPath(filename))
            ]))
            .then(Object.fromEntries))

    getm = (keys: string[]) => Promise.all(keys.map(this.get))

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
        return 1
    })

    delm = (keys: string[]) => this.#deleteFiles(keys.map(el => el + this.ext))

    static home = os.homedir()
    static root = '/'
    static tmp = os.tmpdir()
    static default = Path.join(...[StoreFS.home, '.local', 'state', 'presistore']) //dono for win
    static presistore = process.env.PRESISTORE_DIR || StoreFS.default
}