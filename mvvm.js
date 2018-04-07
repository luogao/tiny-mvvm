function Mvvm(options = {}) {
    this.$options = options
    let data = this._data = this.$options.data
    observe(data)

    for (let key in data) {
        Object.defineProperty(this, key, {
            configurable: true,
            get() {
                return this._data[key];     // 如this.a = {b: 1}
            },
            set(newVal) {
                this._data[key] = newVal;
            }
        });
    }

    initComputed.call(this)

    new Compile(options.el, this)

    options.mounted.call(this)
}
function Observe(data) {
    let dep = new Dep();
    // 所谓数据劫持就是给对象增加get,set
    // 先遍历一遍对象再说
    for (let key in data) {     // 把data属性通过defineProperty的方式定义属性
        let val = data[key];
        observe(val);   // 递归继续向下找，实现深度的数据劫持
        Object.defineProperty(data, key, {
            configurable: true,
            get() {
                Dep.target && dep.addSub(Dep.target)
                return val;
            },
            set(newVal) {   // 更改值的时候
                if (val === newVal) {   // 设置的值和以前值一样就不理它
                    return;
                }
                val = newVal;   // 如果以后再获取值(get)的时候，将刚才设置的值再返回去
                observe(newVal);    // 当设置为新值后，也需要把新值再去定义成属性
                dep.notify()
            }
        });
    }
}

function initComputed() {
    let vm = this
    let computed = this.$options.computed
    Object.keys(computed).forEach(key => {
        Object.defineProperty(vm, key, {
            get: typeof computed[key] === 'function' ? computed[key] : computed[key].get,
            set() { }
        })
    })
}

function observe(data) {
    // 如果不是对象的话就直接return掉
    // 防止递归溢出
    if (!data || typeof data !== 'object') return;
    return new Observe(data);
}
function Compile(el, vm) {
    vm.$el = document.querySelector(el)

    let fragment = document.createDocumentFragment()

    while (child = vm.$el.firstChild) {
        fragment.appendChild(child)
    }

    function replace(frag) {
        Array.from(frag.childNodes).forEach(node => {
            let txt = node.textContent
            let reg = /\{\{(.*?)\}\}/g

            if (node.nodeType === 3 && reg.test(txt)) {
                function replaceTxt() {
                    node.textContent = txt.replace(reg, (matched, placeholder) => {
                        new Watcher(vm, placeholder, replaceTxt)

                        return placeholder.split('.').reduce((val, key) => {
                            return val[key]
                        }, vm)
                    })
                }
                replaceTxt()
            }

            if (node.nodeType === 1) {
                let nodeAttr = node.attributes
                Array.from(nodeAttr).forEach(attr => {
                    let name = attr.name
                    let exp = attr.value
                    if (name.includes('v-')) {
                        node.value = vm[exp]
                    }
                    new Watcher(vm, exp, function (newVal) {
                        node.value = newVal
                    })
                    node.addEventListener('input', e => {
                        let newVal = e.target.value
                        vm[exp] = newVal
                    }, false)
                })
            }

            if (node.childNodes && node.childNodes.length) {
                replace(node)
            }
        })
    }
    replace(fragment)
    vm.$el.appendChild(fragment)
}

function Dep() {
    this.subs = []
}
Dep.prototype = {
    addSub(sub) {
        this.subs.push(sub)
    },
    notify() {
        this.subs.forEach(sub => sub.update())
    }
}

function Watcher(vm, exp, fn) {
    this.fn = fn
    this.vm = vm
    this.exp = exp
    Dep.target = this
    let arr = exp.split('.')
    let val = vm
    arr.forEach(key => {
        val = val[key]
    })
    Dep.target = null
}

Watcher.prototype.update = function () {
    this.fn()
    let arr = this.exp.split('.')
    let val = this.vm
    arr.forEach(key => {
        val = val[key]
    })
    this.fn(val)
}

