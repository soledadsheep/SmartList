; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.plugin('selectable', function (options = {}) {
        const t = this, s = t.settings, st = t.state;
        if (!s.multiple) return;
        const opts = Object.assign({
            checkboxClass: 'sl-cb',
            checkboxPosition: 'start',
            selectAllSelector: null,
            unchecked_icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAQAAAC1QeVaAAAANUlEQVR4AWNYWbWydGUxFliyspphZR0DdgCSWVmEQw4ks7IYp2TxMJLEGwgEgq96ZQmugAcABHA5/TkODDYAAAAASUVORK5CYII=',
            checked_icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA4AAAAOCAYAAAAfSC3RAAABbUlEQVR4AYVSA4ycQRjd2Elt227XMWvbtoNaYTeuYzvVOcaZ0Znz66xZ8918Wfsl43kY6PT31c+i8FzF8EDlu+6KcifcF3M2IiJXERux+56KNZdkrL0sY8+98BwRXflIs48x/CrkKKhyYtN1BTvvKE4i8lzEGUf68ODrCAhNXV4sPycRkRORk70YJJGMD1XMPcFw+O0ACGM8SG5Yf0UmwTDR/EjD+qsylgo1cQmg8ZKzjAQw4QiCcOrTIOadZCQI4ui23lS4RWwsq3Ph+a9RzDvBRDyGdUK5Q/GB8PUfx/TDffFERNwh8i4TTrVtHhD+VDhgfKChqMYJQn27BwtPM2y5oVDEOJHybrwWvuoW5kUinO4QzI9VkDBFTHKkyvQwvLjtlgJl2B8jPvo2gllH+2AMO6UTo7e4QBx+38sBjPIg/lY4Mec4o8uC4X5moivxCehSrI81cqeSyY2KUxcfxJXpzNvjpIwlxyfPWWxTjWMKg8XWCWMAAAAASUVORK5CYII=',
        }, options);

        // đảm bảo state selected tồn tại
        if (!st.selected) st.selected = new Map();
        t._mCb = new Map(); // id -> checkbox element
        t._wmCbEl = new WeakMap(); // checkbox element -> id

        // --------------------------------
        // Inject CSS
        // --------------------------------
        if (!document.getElementById('sl-selectable-style')) {
            const style = document.createElement('style');
            style.id = 'sl-selectable-style';
            style.textContent = `
                .${opts.checkboxClass} {
                  width: 14px;
                  height: 14px;
                  display: inline-block;
                  cursor: pointer;
                  background-repeat: no-repeat;
                  background-position: center;
                  background-size: contain;
                  background-image: url(${opts.unchecked_icon});
                  flex-shrink: 0;
                }
                .${opts.checkboxClass}.checked {
                    background-image: url(${opts.checked_icon});
                }
            `;
            document.head.appendChild(style);
        }

        // -------------------------
        // Inject checkbox vào item mỗi lần render
        // -------------------------
        t.on('render_items', () => {

            t.items.querySelectorAll(`.${s.class._item}`).forEach(itemEl => {
                if (itemEl.querySelector(`.${opts.checkboxClass}`)) return;
                const id = st._wmItems.get(itemEl);
                const cb = document.createElement('span');
                cb.className = opts.checkboxClass;
                t._mCb.set(String(id), cb);
                t._wmCbEl.set(cb, String(id));
                if (st.selected.has(String(id))) cb.classList.add('checked');

                if (opts.checkboxPosition === 'start') itemEl.prepend(cb);
                else itemEl.appendChild(cb);
            });

        });

        t.on('init', () => {

            // -------------------------
            // checkbox_item change
            // -------------------------
            t._onDOM(t.items, 'pointerup', (e) => {
                const cb = e.target.closest(`.${s.class._item}`).querySelector(`.${opts.checkboxClass}`);
                if (!cb) return;
                st.selected.has(t._wmCbEl.get(cb)) ? cb.classList.add('checked') : cb.classList.remove('checked');
            });

            // -------------------------
            // checkbox_all change
            // -------------------------
            const el = opts.selectAllSelector && document.querySelector(opts.selectAllSelector);
            if (!el) return;
            t._onDOM(el, 'change', () => {
                const check = el.checked;
                t.items.querySelectorAll(`.${s.class._item}`).forEach(itemEl => {
                    const id = st._wmItems.get(itemEl);
                    const cb = itemEl.querySelector(`.${opts.checkboxClass}`);
                    if (!cb) return;
                    check ? cb.classList.add('checked') : cb.classList.remove('checked');

                    if (check) st.selected.set(String(id), st.items.get(String(id)));
                    else st.selected.delete(String(id));
                });
                t.renderTags();
                t.syncRoot();
            });

        });

        t.on('item_remove', (id, item) => {
            const cb = t._mCb.get(String(id));
            if (!cb) return;
            cb.classList.remove('checked');
        });

        t.on('destroy', () => {
            t._mCb.clear();
        });
    });
})(typeof window !== 'undefined' ? window : this);