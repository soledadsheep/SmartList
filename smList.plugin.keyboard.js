; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.plugin('keyboard', function (options = {}) {
        const t = this, s = t.state, d = t.settings;

        t.on('init', function () {
            t._onDOM(t.focus_node, 'keydown', (e) => t.onKeyDown(e));

            t.onKeyDown = (e) => {
                const key = e.key;

                // ---------- NAVIGATION ----------
                if (key === 'ArrowDown' || key === 'ArrowUp') {
                    e.preventDefault();
                    if (!s.isOpen) t.openDropdown();

                    const items = t.items.children;
                    if (!items.length) return;

                    let idx = s.hoverIndex;
                    idx += key === 'ArrowDown' ? 1 : -1;

                    if (idx < 0) idx = items.length - 1;
                    if (idx >= items.length) idx = 0;

                    t._setHoverItem(idx);
                    return;
                }

                // ---------- SELECT ----------
                if (key === 'Enter') {
                    if (s.hoverItem) {
                        e.preventDefault();
                        t.toggleItem(s.items.get(s._wmItems.get(s.hoverItem)));
                    }
                    return;
                }

                // ---------- REMOVE TAG ----------
                if ((key === 'Backspace' || key === 'Delete') && d.multiple) {
                    if (t.searchInput.value) return;
                    const tags = t.tags?.children;
                    if (tags && tags.length) {
                        e.preventDefault();

                        // 1. tìm tag selected
                        let removed = false;
                        const selectedEls = Array.from(tags).filter(tag => tag.classList.contains('selected'));
                        for (let i = 0; i < selectedEls.length; i++) {
                            t.toggleItem(s.selected.get(s._wmTags.get(selectedEls[i])), i == selectedEls.length - 1);
                            removed = true;
                        }

                        // 2. nếu không có tag nào selected → xóa tag cuối
                        if (!removed) t.toggleItem([...s.selected.values()].pop(), true);
                    }
                    return;
                }

                // ---------- CLOSE ----------
                if (key === 'Escape' || key === 'Tab') t.closeDropdown();
            }
        });
    });

})(typeof window !== 'undefined' ? window : this);