; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.plugin('selectable', function (options = {}) {
        const t = this, s = t.settings, st = t.state;
        if (!s.multiple) return;

        const opts = Object.assign({
            checkboxClass: 'sl-cb',
            checkboxPosition: 'start',
            selectAllSelector: null
        }, options);

        // đảm bảo state selected tồn tại
        if (!st.selected) st.selected = new Map();

        // -------------------------
        // Inject checkbox vào item mỗi lần render
        // -------------------------
        t.on('render_items', () => {

            t.items.querySelectorAll(`.${s.class._item}`).forEach(itemEl => {
                if (itemEl.querySelector(`.${opts.checkboxClass}`)) return;

                const id = itemEl.dataset.id;

                const cb = document.createElement('input');
                cb.type = 'checkbox';
                cb.className = opts.checkboxClass;
                cb.value = id;
                cb.checked = st.selected.has(String(id));

                if (opts.checkboxPosition === 'start') itemEl.prepend(cb);
                else itemEl.appendChild(cb);
            });

        });

        t.on('init', () => {

            // -------------------------
            // checkbox_item change
            // -------------------------
            t._onDOM(t.items, 'click', (e) => {
                const cb = e.target.closest(`.${s.class._item}`).querySelector(`.${opts.checkboxClass}`);
                if (!cb) return;
                cb.checked = st.selected.has(cb.value);
            });

            // -------------------------
            // checkbox_all change
            // -------------------------
            const el = opts.selectAllSelector && document.querySelector(opts.selectAllSelector);
            if (!el) return;
            t._onDOM(el, 'change', () => {
                const check = el.checked;
                t.items.querySelectorAll(`.${s.class._item}`).forEach(itemEl => {
                    const id = itemEl.dataset.id;
                    const cb = itemEl.querySelector(`.${opts.checkboxClass}`);
                    if (!cb) return;
                    cb.checked = check;

                    if (check) st.selected.set(String(id), st.items.get(String(id)));
                    else st.selected.delete(String(id));
                });
                t.renderTags();
                t.syncRoot();
            });

        });

        t.on('item_remove', (id, item) => {
            const cb = t.items.querySelector(`input[value="${id}"]`);
            if (!cb) return;
            cb.checked = false;
        });
    });
})(typeof window !== 'undefined' ? window : this);