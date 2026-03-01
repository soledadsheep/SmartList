// SmartList v1.5 – Universal Data Renderer
// Author: ducmanhchy@gmail.com

; (function (g, f) {
    typeof define == 'function' && define.amd
        ? define(f)
        : typeof module == 'object' && module.exports
            ? module.exports = f()
            : g.SmartList = f()
})(this, function () {
    'use strict';

    class SmartList {
        constructor(element, config = {}) {
            // get root element (support string selector or HTMLElement)
            if (typeof element === 'string') {
                const nodes = document.querySelectorAll(element);
                if (nodes.length > 1) return [...nodes].map(el => new SmartList(el, config));
                element = nodes[0];
            }
            const root = this.getDom(element);
            if (!root) throw new Error('SmartList: Cannot find element');
            if (root.SmartList) throw new Error('SmartList already initialized on this element');

            // set instance to element
            root.SmartList = this;
            this.root = root;

            this.settings = {
                source: null,
                scope: document,
                multiple: root.hasAttribute('multiple'),
                closeable: true,
                closeDropdownOnSelect: false,
                alwaysOpenDropdown: false,
                maxItemSelectable: -1,
                placeholder: 'Tìm kiếm...',
                maxHeight: '300px',
                hasRemoveTag: true,
                idField: 'id',          // id in datasource
                labelField: 'label',    // label in datasource
                constant: {
                    attr_startWith: "sl"
                },
                class: {
                    _container: 'sl-ctn',
                    _head: 'sl-head',
                    _tags: 'sl-tags',
                    _tag: 'sl-tag',
                    _tagLabel: 'sl-tag-lb',
                    _tagRemove: 'sl-tag-rm',
                    _control: 'sl-ctrl',
                    _searchInput: 'sl-sch',
                    _list: 'sl-list',
                    _items: 'sl-items',
                    _item: 'sl-item',
                },
                render: {
                    parentTags: '',         // tags sẽ đặt trong thẻ này
                    parentSearchInput: '',  // searchInput sẽ đặt trong thẻ này
                    parentDropdown: ''      // list sẽ đặt trong thẻ này
                },
                templates: {
                    container: (cls = this.settings.class) => `<div class="${[cls._container, cls.container].filter(v => !!v).join(' ')}"></div>`,
                    head: (cls = this.settings.class) => `<div class="${[cls._head, cls.head].filter(v => !!v).join(' ')}"></div>`,
                    tags: (cls = this.settings.class) => `<div class="${[cls._tags, cls.tags].filter(v => !!v).join(' ')}"></div>`,
                    tag: (data, cls = this.settings.class) => `
                        <div class="${[cls._tag, cls.tag].filter(v => !!v).join(' ')}">
                            <span class="${[cls._tagLabel, cls.tagLabel].filter(v => !!v).join(' ')}">${data.item.label}</span>
                            ${this.settings.hasRemoveTag && !this.settings.disabled ? `<span class="${[cls._tagRemove, cls.tagRemove].filter(v => !!v).join(' ')}">×</span>` : ''}
                        </div>`,
                    control: (cls = this.settings.class) => `<div class="${[cls._control, cls.control].filter(v => !!v).join(' ')}"></div>`,
                    searchInput: (data, cls = this.settings.class) => `<input class="${[cls._searchInput, cls.searchInput].filter(v => !!v).join(' ')}" type="text" placeholder="${this.settings.placeholder}" />`,
                    list: (data, cls = this.settings.class) => `<div class="${[cls._list, cls.list].filter(v => !!v).join(' ')}" style="max-height: ${data.maxHeight};"></div>`,
                    items: (cls = this.settings.class) => `<div class="${[cls._items, cls.items].filter(v => !!v).join(' ')}"></div>`,
                    item: (data, cls = this.settings.class) => `<div class="${[cls._item, cls.item].filter(v => !!v).join(' ')}">${data.item.label}</div>`,
                    noResults: (cls = this.settings.class) => `<div class="${[cls._item, cls.item].filter(v => !!v).join(' ')}">Không tìm thấy kết quả</div>`,
                },
            };

            // Setup state
            this.state = {
                staticItems: new Map(), // Map <id, item> – data static của root
                items: new Map(),       // Map <id, item> – tất cả data đã load
                selected: new Map(),    // Map <id, item> – items đang được chọn
                _mItems: new Map(),     // Map <id, itemEl> – tất cả data đã load
                _wmItems: new WeakMap(),// Map <id, itemEl> – tất cả data đã load
                _mTags: new Map(),      // Map <id, tagEl> – tất cả data đã load
                _wmTags: new WeakMap(), // Map <id, tagEl> – tất cả data đã load
                isOpen: false,          // State of dropdown
                isLoading: false,       // Trạng thái đang load
                debugger: true,
            }
            this._events = {};          // store event callback
            this._domListeners = [];    // store DOM event listeners for cleanup

            this._mergeSettings(root, config);
            this._initFeatures();
            this._initCallbacks();
            this._initTheme();
            this._initTemplate();

            // Bind events
            this.focus_node = this.searchInput;
            this._bindEvents(); //  trigger event init on this for sure DOM is ready

            if (this.state.isOpen || this.settings.alwaysOpenDropdown) this.openDropdown();
            else {
                this.state.isOpen = true;
                this.closeDropdown();
            }
            this.load();
            this.syncRoot();

            // Auto destroy khi không cần (document không chứa this.root - ex: redirect page)
            this._observer = new MutationObserver((observers) => {
                for (const o of observers) {
                    if (!document.contains(this.root)) {
                        this.destroy();
                        break;
                    }
                }
            });
            this._observer.observe(document.body, { childList: true, subtree: true });
        }

        async load() {
            const t = this, s = t.settings, sc = s.source, st = t.state;
            if (st.isLoading) return;
            st.isLoading = true;

            // source là array
            const isArray = Array.isArray(sc);
            const isStatic = !sc && st.staticItems && st.staticItems.size > 0;
            if (isArray || isStatic) {
                // Lấy tất cả items gốc
                const items = Array.isArray(sc)
                    ? sc.map(entry => {
                        const item = typeof entry === 'object' && entry !== null && entry[s.idField] !== undefined
                            ? { id: String(entry[s.idField]), label: entry[s.labelField] || entry[s.idField], ...entry }
                            : { id: String(entry), label: String(entry) };
                        return item;
                    })
                    : Array.from(st.staticItems.values());

                // Áp dụng filter đơn giản nếu có searchInput value
                const v = t.searchInput?.value?.trim() || '';
                if (v) t._applyFilter(items, v);
                else st.items = new Map(items.map(i => [String(i.id), i]));
            }

            t.trigger('load');
            t.renderItems();
            t.renderTags();
            st.isLoading = false;
        }

        // filter đơn giản (fallback khi không có plugin)
        _applyFilter(items, query) {
            if (!items || !items.any()) return;

            const q = query.toLowerCase();
            const r = items.filter(i => {
                return i.label.toLowerCase().includes(q);
            });
            this.state.items = new Map(r.map(i => [String(i.id), i]));
        }

        // merge config config -> data-attr -> default
        _mergeSettings(root, config) {
            const t = this, s = t.state, sl = s.selected, st = t.settings, attr = {};

            for (const a of root.attributes) {
                if (a.name.startsWith(st.constant.attr_startWith)) {
                    const key = a.name.replace(st.constant.attr_startWith, '').replace(/-([a-z])/g, g => g[1].toLowerCase());
                    try { attr[key] = JSON.parse(a.value); }
                    catch { attr[key] = a.value; }
                }
                else if (a.name === 'style') attr.style = a.value;
                else if (a.name === 'placeholder') attr.placeholder = a.value;
                else if (a.name === 'tabIndex') attr.tabIndex = a.value || 0;
                else if (a.name === 'required') attr.required = true;
                else if (a.name === 'disabled') attr.disabled = true;
                else if (a.name === 'rtl') attr.rtl = /rtl/i.test(getComputedStyle(root).direction);
            }
            if (config.multiple) st.multiple = config.multiple;
            if (!st.multiple) st.maxItemSelectable = 1;

            const _loadDataFromRoot = () => {
                const tagName = root.tagName.toLowerCase();
                const parseDataString = (str) => {
                    if (!str) return [];
                    try {
                        const data = JSON.parse(str);
                        return Array.isArray(data) ? data : [];
                    } catch (e) {
                        if (s.debugger) console.log('Data error. Wrong format json!');
                        return str.split(/[\n,;]+/).map(v => v.trim()).filter(v => v);
                    }
                };

                // attr selected
                const selectedIds = parseDataString(root.dataset.selected).map(v => typeof v === 'object' && v[st.idField] !== undefined ? v[st.idField] : String(v));
                if (!st.multiple && selectedIds.length > 1) sl.set(String(selectedIds[0]), { id: selectedIds[0], label: selectedIds[0] });
                else selectedIds.forEach(id => sl.set(String(id), { id, label: id }));

                const _loadDataFromVal = (str) => {
                    if (!str) return;
                    let data = parseDataString(str);

                    data.forEach(entry => {
                        const item = typeof entry === 'object' && entry !== null && entry[st.idField] !== undefined
                            ? { id: String(entry[st.idField]), label: entry[st.labelField] || entry[st.idField], ...entry }
                            : { id: String(entry), label: String(entry) };

                        s.staticItems.set(String(item.id), item);
                        if (sl.has(String(item.id))) sl.set(String(item.id), item);
                    });
                }

                const _loadDataFromSelect = (select) => {
                    select.querySelectorAll('option').forEach(opt => {
                        if (opt.disabled) return;
                        const id = opt.value;
                        const item = { id: id, label: opt.textContent.trim() || id };
                        s.staticItems.set(String(id), item);
                        // !dataset.selected + opt select → add selected
                        if ((opt.hasAttribute('selected') && !sl.length) || sl.has(String(item.id))) sl.set(String(id), item);
                    });
                }

                // attr items
                const items = root.dataset.items || '';
                let hasAttrItems = false;
                if (items) {
                    hasAttrItems = true;
                    _loadDataFromVal(items);
                }

                // option/value
                if (!hasAttrItems) {
                    if (tagName === 'select') _loadDataFromSelect(root);
                    else if (tagName === 'input') _loadDataFromVal(root.value.trim());
                }
            }
            _loadDataFromRoot();
            root.removeAttribute('data-items');
            root.removeAttribute('data-selected');

            const _isObject = (val) => Object.prototype.toString.call(val) === "[object Object]";
            const _deepMerge = (target, ...sources) => {
                if (!sources.length) return target;

                const src = sources.shift();
                if (!_isObject(src)) return _deepMerge(target, ...sources);
                if (!_isObject(target)) target = {};

                for (const k of Object.keys(src)) {
                    const srcVal = src[k];
                    const tarVal = target[k];

                    // Array → override
                    if (Array.isArray(srcVal)) target[k] = [...srcVal];
                    // Object → recursive merge
                    else if (_isObject(srcVal)) target[k] = _deepMerge(_isObject(tarVal) ? tarVal : {}, srcVal);
                    // Primitive → override
                    else target[k] = srcVal;
                }

                return _deepMerge(target, ...sources);
            };
            t.settings = _deepMerge({}, st, attr, config);
        }

        _initFeatures() {
            const plugins = this.settings.plugins || [];
            const enabled = {};

            if (Array.isArray(plugins)) {
                plugins.forEach(p => {
                    // ['a', 'b', 'c']
                    if (typeof p === 'string') enabled[p] = true;
                    // [{'name': 'a', options: {}}, {'name': 'b', options: {}}]
                    else if (p && p.name) enabled[p.name] = p.options || true;
                });
            }
            // {'a': { ... }, 'b': { ... }, 'c': { ... }}
            else if (plugins && typeof plugins === 'object') Object.assign(enabled, plugins);

            // Duyệt và chạy các plugin được bật
            for (const name in enabled) {
                if (enabled[name] === false) continue;

                const fn = SmartList.plugins[name];
                if (!fn) {
                    console.warn(`SmartList: Plugin "${name}" không tồn tại.`); continue;
                }

                // Gọi plugin – this chính là instance, options là config
                fn.call(this, enabled[name]);
            }
        }

        _initCallbacks() {
            let key, fn;
            let callbacks = {
                'init': 'onInit',
                'load': 'onLoad',
                'load_error': 'onLoadError',
                'item_add': 'onItemAdd',
                'item_remove': 'onItemRemove',
                'render_tags': 'onRenderTags',
                'render_items': 'onRenderItems',
                'dropdown_open': 'onDropdownOpen',
                'dropdown_close': 'onDropdownClose',
                'destroy': 'onDestroy',
            };
            for (key in callbacks) {
                fn = this.settings[callbacks[key]];
                if (fn) this.on(key, fn);
            }
        }

        _initTheme() {
            let s = this.settings;
            let t = SmartList.themes[s.theme || 'default'];
            if (t && typeof t === 'object') s.class = Object.assign(s.class, t.classMap);
        }

        _initTemplate() {
            let t = this, s = t.settings, cls = s.class, tmps = s.templates;

            // Render từng phần riêng biệt
            t.container = t.getDom(t._renderTemplate(tmps.container, cls));
            t.head = t.getDom(t._renderTemplate(tmps.head, cls));
            t.tags = t.getDom(t._renderTemplate(tmps.tags, cls));
            t.control = t.getDom(t._renderTemplate(tmps.control, cls));
            t.searchInput = t.getDom(t._renderTemplate(tmps.searchInput, cls));
            t.list = t.getDom(t._renderTemplate(tmps.list, cls));
            t.items = t.getDom(t._renderTemplate(tmps.items, cls));

            if (s.style) t.container.style = s.style;
            if (s.tabIndex) t.container.tabIndex = s.tabIndex;

            // Xây dựng cây DOM
            /**
            <div class="sl-container">
                <div class="sl-head">
                    <div class="sl-tags">
                        <div class="sl-tag"></div>
                        <div class="sl-tag"></div>
                    </div>
                    <div class="sl-control">
                        <input class="sl-searchInput" type="input"/>
                        <div class="sl-clear"></div>
                    </div>
                </div>
                <div class="sl-list">
                    <div class="sl-items">
                        <div class="sl-item"></div>
                        <div class="sl-item"></div>
                    </div>
                </div>
            </div>
             */
            const _setupDOMTemplate = () => {
                const r = s.render;

                t.container.appendChild(t.head);
                if (s.multiple) t.getDom(r.parentTags || t.head).appendChild(t.tags);
                t.head.appendChild(t.control);
                t.getDom(r.parentSearchInput || t.control).appendChild(t.searchInput);
                t.getDom(r.parentDropdown || t.container).appendChild(t.list);
                t.list.appendChild(t.items);

                // Chèn container vào trang
                t.root.style.display = 'none';
                t.root.parentNode.insertBefore(t.container, t.root.nextSibling);
            }
            _setupDOMTemplate();
        }

        _bindEvents() {
            const t = this, s = t.state, d = t.settings, cls = d.class;
            const _bindHover = (container, selector) => {
                let hoverEl = null;
                this._onDOM(container, 'mousemove', e => {
                    const el = e.target.closest(selector);
                    if (!el || el === hoverEl) return;
                    hoverEl?.classList.remove('hover');
                    el.classList.add('hover');
                    hoverEl = el;
                });
                this._onDOM(container, 'mouseleave', () => {
                    hoverEl?.classList.remove('hover');
                    hoverEl = null;
                });
            }
            t._setHoverItem = (idx) => {
                const items = t.items.children;
                const prev = s.hoverItem;
                if (prev) prev.classList.remove('hover');

                const item = items[idx];
                if (!item) return;

                item.classList.add('hover');
                s.hoverIndex = idx;
                s.hoverItem = item;
            }
            t._resetHoverItem = () => {
                s.hoverItem?.classList.remove('hover');
                s.hoverItem = null;
                s.hoverIndex = -1;
            }
            if (d.disabled) return;

            /**
                pointerdown → mousedown → blur (el cũ) → focus (el mới) → pointerup → mouseup → click
             */
            // click outside container or list (list not inside container)
            t._onDOM(document, 'pointerdown', (e) => {
                if (!t.container.contains(e.target) && !t.list.contains(e.target)) t.closeDropdown();
            });

            if (d.closeable) {
                t._onDOM(t.head, 'pointerdown', (e) => {
                    if (e.target.closest(`.${cls._tag}`)) return;
                    t.toggleDropdown();
                });
            }

            if (d.multiple) {
                // hover tag
                _bindHover(t.tags, `.${cls._tag}`);
                // click tag
                t._onDOM(t.tags, 'pointerdown', (e) => {
                    const tag = e.target.closest(`.${cls._tag}`);
                    if (!tag || !s._wmTags.has(tag)) return;

                    const id = s._wmTags.get(tag);
                    const rm = e.target.closest(`.${cls._tagRemove}`);
                    // remove tag
                    if (d.hasRemoveTag && rm) t.toggleItem(s.selected.get(String(id)));
                    else tag.classList.toggle('selected');
                });
            }

            // hover item
            t._onDOM(t.items, 'mousemove', e => {
                const item = e.target.closest(`.${cls._item}`);
                if (!item) {
                    t._resetHoverItem(); return;
                }

                const idx = [...t.items.children].indexOf(item);
                if (idx !== t.state.hoverIndex) t._setHoverItem(idx);
            });
            // click item
            t._onDOM(t.items, 'pointerup', (e) => {
                e.preventDefault(); // chặn hành động mặc định (ex: click checkbox)
                const itemEl = e.target.closest(`.${cls._item}`);
                if (!itemEl || !s._wmItems.has(itemEl)) return;

                const item = s.items.get(s._wmItems.get(itemEl));
                if (!item) return;

                t.toggleItem(item);
                if (d.closeDropdownOnSelect) t.closeDropdown();
            });

            t._onDOM(t.searchInput, 'input', (e) => t.onInput(e));
            t._onDOM(t.focus_node, 'click', (e) => t.onClick(e));
            t._onDOM(t.focus_node, 'focus', (e) => t.onFocus(e));
            t._onDOM(t.focus_node, 'blur', (e) => t.onBlur(e));

            t.onInput = (e) => {
                t.load();
                t.openDropdown();
            }
            t.onClick = (e) => t.openDropdown();
            t.onFocus = (e) => t.openDropdown();
            t.onBlur = (e) => { }

            t.trigger('init');
        }

        syncRoot() {
            const t = this, s = t.state.selected;
            if (t.root?.tagName !== 'SELECT') return;
            t.root.replaceChildren();
            for (const item of s.values()) {
                let o = document.createElement('option');
                o.value = item.id;
                o.textContent = item.label;
                o.selected = true;
                t.root.appendChild(o);
            }
            //t.root.dispatchEvent(new Event('change', { bubbles: true }));
        }

        toggleItem(item, resetUI = true) {
            const t = this;
            let itemEl = t.state._mItems.get(String(item.id));
            if (!t.settings.multiple) t.items.querySelectorAll('.selected').forEach(el => el.classList.remove('selected'));
            if (t.state.selected.has(String(item.id))) {
                itemEl?.classList.remove('selected');
                t.removeItem(item.id);
            }
            else {
                itemEl?.classList.add('selected');
                t.addItem(item);
            }
            if (resetUI) {
                t.renderTags();
                t.syncRoot();
            }
        }

        // add item selected
        addItem(item) {
            const t = this, s = t.state.selected, d = t.settings, max = d.maxItemSelectable;

            if (!d.multiple) s.clear();
            if (max > 0 && s.size >= max) return false;

            s.set(String(item.id), item);
            t.trigger('item_add', item.id, item);
        }

        // remove item selected
        removeItem(id) {
            const s = this.state.selected;
            const item = s.get(String(id));
            if (!item) return false;

            s.delete(String(id));
            this.trigger('item_remove', id, item);
        }

        renderTags() {
            const t = this, d = t.settings, s = t.state;
            // single select
            if (!d.multiple) {
                t.singleText?.remove();
                const item = s.selected.values().next().value;
                if (item) {
                    t.singleText = document.createTextNode(item.label);
                    t.head.insertBefore(t.singleText, t.control);
                }
                return;
            }
            // multiple select
            t.tags.replaceChildren(), s._mTags.clear();
            let fragment = document.createDocumentFragment();
            s.selected.forEach(item => {
                const el = t.getDom(t._renderTemplate(d.templates.tag, { item }).trim());
                if (el) {
                    s._wmTags.set(el, String(item.id));
                    s._mTags.set(String(item.id), el);
                    fragment.appendChild(el);
                }
            });
            t.tags.appendChild(fragment);
            t.trigger('render_tags', t);
        }

        renderItems(append = false) {
            const t = this, tpl = t.settings.templates, s = t.state;
            if (!t.items) return;
            if (!append) t.items.replaceChildren(), s._mItems.clear();
            let fragment = document.createDocumentFragment();

            if (s.items.size === 0) fragment.appendChild(t.getDom(t._renderTemplate(tpl.noResults).trim()));
            else s.items.forEach(item => {
                let el = t.getDom(t._renderTemplate(tpl.item, { item }).trim());
                if (el) {
                    s._wmItems.set(el, String(item.id));
                    s._mItems.set(String(item.id), el);
                    if (s.selected.has(String(item.id))) el.classList.add('selected');
                    fragment.appendChild(el);
                }
            });

            t.items.appendChild(fragment);
            t.trigger('render_items');
        }

        toggleDropdown() {
            if (this.state.isOpen) this.closeDropdown();
            else this.openDropdown();
        }

        openDropdown() {
            const t = this;
            if (t.state.isOpen) return;
            t.state.isOpen = true;
            t.list.style.display = 'block';
            t.trigger('dropdown_open');
        }

        closeDropdown() {
            const t = this;
            if (!t.state.isOpen || t.settings.alwaysOpenDropdown) return;
            t.state.isOpen = false;
            t.list.style.display = 'none';
            t._resetHoverItem();
            t.trigger('dropdown_close');
        }

        // render template context
        _renderTemplate(tpl, ctx = {}) {
            return typeof tpl === 'function' ? tpl.call(this, { ...ctx }) : tpl || '';
        }

        // return HTMLElement
        getDom(arg) {
            if (!arg) return null;
            if (arg instanceof Element) return arg;
            if (typeof arg === 'string') {
                if (arg[0] === '<') {
                    let t = document.createElement('template');
                    t.innerHTML = arg.trim();
                    return t.content.firstChild;
                }
                return document.querySelector(arg);
            }
        }

        destroy() {
            const t = this;  let s = t.state, m = t._observer;

            // Ngăn destroy nhiều lần
            if (t._destroyed) return;
            t._destroyed = true;

            // Trigger destroy event trước khi cleanup
            t.trigger('destroy');

            // Ngắt kết nối MutationObserver
            m?.disconnect(), m = null;

            // Xóa tất cả DOM event listeners
            t._offAllDOM();

            // Xóa DOM elements được tạo
            if (t.container && t.container.parentNode) t.container.parentNode.removeChild(t.container);

            // Xóa reference SmartList từ root element
            delete t.root.SmartList;

            // Xóa tất cả event callbacks
            t._events = {};

            // Xóa state
            if (s) {
                s.staticItems?.clear();
                s.items?.clear();
                s.selected?.clear();
                s._mTags?.clear();
                s._mItems?.clear();
                s = null;
            }

            // Xóa references
            t.container = t.head = t.tags = t.control = t.searchInput = t.list = t.items = t.focus_node = t.root = null;
        }

        on(events, fn) {
            const t = this;
            t._forEvents(events, (e) => {
                let fns = t._events[e] || [];
                fns.push(fn);
                t._events[e] = fns;
            });
        }

        off(events, fn) {
            const t = this;
            var n = arguments.length;
            if (n === 0) {
                t._events = {};
                return;
            }
            t._forEvents(events, (e) => {
                if (n === 1) {
                    delete t._events[e];
                    return;
                }
                let fns = t._events[e];
                if (!fns) return;
                fns.splice(fns.indexOf(fn), 1);
                t._events[e] = fns;
            });
        }

        trigger(events, ...args) {
            const t = this;
            t._forEvents(events, (e) => {
                let fns = t._events[e];
                if (!fns) return;
                fns.forEach(fn => { fn.apply(t, args); });
            });
        }

        _forEvents(events, callback) {
            events.split(/\s+/).forEach((e) => { callback(e); });
        }

        // add DOM EventListener
        _onDOM(el, e, handler, options = false) {
            el.addEventListener(e, handler, options);
            this._domListeners.push({ el, e, handler, options });
        }

        // del all DOM listeners
        _offAllDOM() {
            let l = this._domListeners;
            l.forEach(({ el, e, handler, options }) => {
                if (el && handler) el.removeEventListener(e, handler, options);
            });
            l = [];
        }

        // api
        getSelected() {
            return this.state.selected.values();
        }

        clearSelection() {
            let ids = [...this.state._mTags.keys()];
            for (let i = 0; i < ids.length; i++) {
                this.toggleItem(this.state.selected.get(ids[i]), i == ids.length - 1);
            }
        }
    }

    SmartList.themes = {};
    SmartList.theme = (name, config) => {
        SmartList.themes[name] = config;
    };

    SmartList.plugins = {};
    SmartList.plugin = (name, fn) => {
        if (typeof name !== 'string' || name === '') throw new Error('SmartList: Plugin name must be a non-empty string');
        if (typeof fn !== 'function') throw new Error('SmartList: Plugin fn is not a function');
        SmartList.plugins[name] = fn;
    };

    return SmartList;
});