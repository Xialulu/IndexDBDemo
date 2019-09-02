class DBbase {
    constructor(name, version, objectStore) {
        this.name = name;
        this.version = version;
        this.objectStore = objectStore || {
            name: 'books', //存储空间表的名字
            keypath: 'id' //主键
        };
        this.db = null;
        this.indexDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        this.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange;
        this.openIndexDB = null;
    }

    // 打开并且创建indexDb
    openDB = (index) => {
        this.openIndexDB = this.indexDB.open(this.name, this.version);
        console.log('openIndexDB', this.openIndexDB)

        return new Promise((res, rej) => {
            this.openIndexDB.onupgradeneeded = (event) => {
                console.log('name', this.name)
                let db = event.target.result;
                if (!db.objectStoreNames.contains(this.name)) {
                    let source = db.createObjectStore(this.objectStore.name, {
                        keyPath: this.objectStore.keypath
                    });
                    for (let i = 0; i < index.length; i++) {
                        source.createIndex(index[i].name, index[i].name, { unique: index[i].unique });
                    }
                }
                console.log('成功创建对象存储空间---', this.objectStore.name, '', this.objectStore.keypath)
                db.onerror = (event) => {
                    console.log('addKeyPath', event)

                }
            }
            this.openIndexDB.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('成功建立并打开数据库---', this.name)
                res({
                    type: 'success',
                    event: event
                })
            }

            this.openIndexDB.onerror = (event) => {
                rej({
                    type: 'fail',
                    event: event
                })
            }

        })

    }


    /**
     * 添加数据
     * @params {Object} data 数据
     */
    addData = (data) => {
        let store = this.db.transaction([this.objectStore.name], 'readwrite').objectStore(this.objectStore.name)
        let request = store.add({ ...data });
        return new Promise((res, rej) => {
            request.onsuccess = (event) => {
                res({
                    type: 'success',
                    event: event
                })
            }

            request.onerror = (event) => {
                rej({
                    type: 'fail',
                    event: event
                })
            }
        })
    }

    /**
    * 批量添加数据
    * @params {Array} data 数据
    */
    addDataAll = (data) => {
        let store = this.db.transaction([this.objectStore.name], 'readwrite').objectStore(this.objectStore.name);
        let promiseList = [];
        for (let i = 0; i < data.length; i++) {
            let request = store.add(data[i]);
            let promiseSource = new Promise((res, rej) => {
                request.onsuccess = (event) => {
                    res({
                        type: 'success',
                        event: event
                    })
                }

                request.onerror = (event) => {
                    rej({
                        type: 'fail',
                        event: event
                    })
                }
            });
            promiseList.push(promiseSource);
        }

        return Promise.all(promiseList)
    }

    // 读取遍历数据

    traverseData = () => {
        let store = this.db.transaction([this.objectStore.name], 'readonly').objectStore(this.objectStore.name);
        let cursor = store.openCursor();
        let data = [];
        return new Promise((res, rej) => {
            cursor.onsuccess = (e) => {
                const source = e.target.result;
                if (source && source.value) {
                    data.push(source.value);
                    source.continue();
                } else {
                    res({
                        type: 'success',
                        event: data
                    })
                }
            }

        })
    }

    // 删除
    deleteData = (key) => {
        let transaction = this.db.transaction([this.objectStore.name], 'readwrite');
        let store = transaction.objectStore(this.objectStore.name);
        const request = store.delete(Number(key));
        return new Promise((res, rej) => {
            request.onsuccess = (e) => {
                res({
                    type: 'success',
                    event: e
                })
            }

            transaction.oncomplete = (e) => {
                console.log('dele oncomplete', key, e);
                rej({
                    type: 'fail',
                    event: e
                })
            }
        });
    }

    // 修改
    updateDate = (data) => {
        let transaction = this.db.transaction(this.objectStore.name, 'readwrite');
        let store = transaction.objectStore(this.objectStore.name);
        let request = store.get(data.id);
        return new Promise((res, rej) => {
            request.onsuccess = (event) => {
                var updateRequest = store.put(data);
                updateRequest.onsuccess = (eve) => {
                    res({
                        type: 'success',
                        event: eve
                    })
                }

                updateRequest.onerror = (eve) => {
                    rej({
                        type: 'fail',
                        event: eve
                    })
                }

            }

            request.onerror = (eve) => {
                rej({
                    type: 'fail',
                    event: eve
                })
            }
        })
    }


    delectDB = () => {
        this.indexDB.deleteDatabase(this.objectStore.name);

    }

    clearDate = () => {
        let transaction = this.db.transaction([this.objectStore.name], "readwrite");
        let objectStoreRequest = transaction.objectStore(this.objectStore.name).clear();
        return new Promise((res, rej) => {
            objectStoreRequest.onsuccess = (eve) => {
                res({
                    type: 'success',
                    event: eve
                })
            }

            objectStoreRequest.onerror = (eve) => {
                res({
                    type: 'fail',
                    event: eve
                })
            }
        })
    }

    // 模糊搜索

    search = (search) => {
        let objstore = this.db.transaction(this.objectStore.name, "readonly").objectStore(this.objectStore.name);
        let range = IDBKeyRange.bound(search, search + '\uffff');
        let req = objstore.index('bookName').openCursor(range, 'prev');
        let data = [];
        return new Promise((res, rej) => {
            req.onsuccess = (event) => {
                let cursor = event.target.result;
                console.log('cursor', event, cursor);
                if (cursor && cursor.value) {
                    data.push(cursor.value);
                    cursor.continue();
                } else {
                    res({
                        type: 'success',
                        event: data
                    })
                }
            }

            req.onerror = (event) => {
                rej({
                    type: 'fail',
                    event
                })
            }
        })
    }
}