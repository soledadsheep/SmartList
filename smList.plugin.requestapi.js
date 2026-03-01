// Plugin requestApi: hỗ trợ load dữ liệu từ API (fetch hoặc function trả về Promise)

; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.plugin('requestApi', function (options = {}) {
        const t = this, s = t.settings, st = t.state, sc = s.source;
        const opts = Object.assign({
            mode: 'infinity', // 'paging' hoặc 'infinity'
            threshold: 3, // khoảng cách (số item) tính từ cuối danh sách để trigger load thêm (chỉ dùng khi mode = 'infinity')
            pageSize: 5,
            filters: [],    // filter ẩn, luôn áp dụng. ex: [{ "field": "Name", "value": zoneId }]
            sorters: [],    // sorter ẩn, luôn áp dụng. ex: [{ "field": "Name", "direction": "asc" }]
            filterControls: [{ field: s.labelField, operator: "contains", quicksearch: true }], // [{ selector: string, field: string, operator: string, type?: string, quicksearch?: boolean }]
            sorterControls: [], // [{ selector: string, field: string, type?: string }]
            parentPaging: null, // selector hoặc element chứa pagination (chỉ dùng khi mode = 'paging')
            templates: {
                pagination: {
                    wrapper: '<ul class="pagination"></ul>',
                    page: '<li class="page-item"><a href="#" class="page-link" data-page="{page}">{page}</a></li>',
                }
            }
        }, options);

        // Bổ sung cache
        t.cache = {
            enabled: true,
            ttl: 1000 * 60 * 5, // 5 phút
            _store: new Map()
        };

        // Method cache
        t._getCachedData = (key) => {
            if (!t.cache.enabled || !t.cache._store.has(key)) return null;

            const entry = t.cache._store.get(key);
            const now = Date.now();

            // Sliding expiration
            if (now - entry.timestamp <= t.cache.ttl) {
                entry.timestamp = now;
                t.cache._store.set(key, entry);
                return entry.data;
            } else {
                t.cache._store.delete(key);
                return null;
            }
        };

        t._setCache = (key, data) => {
            if (!t.cache.enabled) return;
            t.cache._store.set(key, {
                data,
                timestamp: Date.now()
            });
        };

        t._generateCacheKey = (params) => {
            return JSON.stringify({
                url: typeof sc === 'string' ? sc : 'fn',
                page: st.currentPage,
                filters: params.filters,
                sorters: params.sorters
            });
        };

        t.clearCache = () => {
            t.cache._store.clear();
        };

        // Override hàm load của instance (bổ sung cache + loadmore)
        t.load = async (page = 1, append = false) => {
            st.currentPage = page;
            if (st.isLoading || (!(st.hasMore ?? true) && append)) return;
            st.isLoading = true;
            let itemArray = [];
            let params = t._buildRequestParams();

            // check cache trước
            const cacheKey = t._generateCacheKey(params);
            const cachedData = t._getCachedData(cacheKey);
            if (cachedData) {
                itemArray = cachedData.itemArray;
                st.total = cachedData.total;
            }
            else {
                let data;
                try {
                    if (typeof sc === 'function') data = await sc.call(t, params);
                    else {
                        const res = await fetch(sc, {
                            method: 'POST',
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(params)
                        });
                        if (!res.ok) throw new Error(`SmartList: Fetch error - ${res.status}`);
                        data = await res.json();
                    }

                    itemArray = Array.isArray(data) ? data : data.items || data.data || data.results || [];
                    st.total = data.totalRecord || data.total || itemArray.length;

                    // set cache
                    t._setCache(cacheKey, { itemArray, total: st.total });
                }
                catch (err) {
                    st.isLoading = false;
                    if (s.debugger) console.error(err);
                    t.trigger('load_error', err);
                    return;
                }
            }

            st.hasMore = page * opts.pageSize < st.total;

            // mode paging/infinity search
            if (!append) st.items.clear();

            itemArray.forEach(entry => {
                const item = typeof entry === 'object' && entry !== null && entry[s.idField] !== undefined
                    ? { id: String(entry[s.idField]), label: entry[s.labelField] || entry[s.idField], ...entry }
                    : { id: String(entry), label: String(entry) };
                st.items.set(String(item.id), item);
            });

            st.selected.forEach((sel, id) => {
                if (st.items.has(String(id))) st.selected.set(String(id), st.items.get(String(id)));
            });

            st.isLoading = false;
            t.renderItems(false);  // mode infinity st.items đã được append và renderItems render theo st.items nên không cần truyền append = true tránh render lại
            if (page === 1 && s.multiple) t.renderTags();
            t.trigger('load_end', { data: itemArray, total: st.total });
        };

        // Hàm build params
        t._buildRequestParams = () => {
            const filters = [...opts.filters], sorters = [...opts.sorters];

            const _detectType = (el) => {
                if (!el) return "unknown";
                const tag = el.tagName.toLowerCase();
                if (tag === "select") return "select";
                if (tag === "input") {
                    const type = el.getAttribute("type") || "";
                    if (["checkbox", "radio", "text"].includes(type)) return type;
                    return "input";
                }
                if (["button", "a"].includes(tag)) return "button";
                return "unknown";
            };

            // Filters (push thêm từ filterControls)
            for (const cfg of opts.filterControls) {
                let value = null;
                if (cfg.quicksearch === true) {
                    if (t.searchInput && t.searchInput.value?.trim()) value = t.searchInput.value?.trim();
                    else continue;
                }
                else {
                    const el = t.getDom(s.scope).querySelector(cfg.selector);
                    if (!el) continue;
                    switch (cfg.type || _detectType(el)) {
                        case "text": case "select": value = el.value?.trim(); break;
                        case "checkbox": value = el.checked; break;
                        case "radio": value = t.getDom(s.scope).querySelector(`input[name="${el.name}"]:checked`)?.value; break;
                        case "button": value = el.classList.contains("active") ? el.dataset.value : ""; break;
                    }
                }
                if (value) filters.push({ field: cfg.field, operator: cfg.operator, value: value });
            }

            // Sorters (push thêm từ sorterControls)
            for (const cfg of opts.sorterControls) {
                const el = t.getDom(s.scope).querySelector(cfg.selector);
                if (!el) continue;
                let value = null;
                switch (cfg.type || _detectType(el)) {
                    case "select": value = el.value?.trim(); break;
                    case "radio": value = t.getDom(s.scope).querySelector(`input[name="${el.name}"]:checked`)?.value; break;
                    case "button": value = el.dataset.sort || "asc"; break;
                }
                if (value) sorters.push({ field: cfg.field, direction: value });
            }

            return {
                pagination: { page: st.currentPage, limit: opts.pageSize },
                sorters: sorters,
                filters: filters
            };
        };

        t.onInput = (e) => {
            t.load(1, false);
            t.openDropdown();
        }

        t.on('init', () => {
            // Bổ sung: event scroll cho infinity mode (nếu mode === 'infinity')
            if (opts.mode === 'infinity') {
                let itemHeight = 0; isSet = false;
                t._onDOM(t.list, 'scroll', (e) => {
                    if (st.isLoading || !st.hasMore) return;
                    if (!isSet) {
                        itemHeight = t.items.clientHeight / st.items.size;
                        isSet = true;
                    }
                    if (t.list.scrollHeight - t.list.scrollTop - t.list.clientHeight <= itemHeight * opts.threshold) t.load(st.currentPage + 1, true);
                }, { passive: true });
            }
            // Bổ sung: render pagination cho paging mode
            else if (opts.mode === 'paging') {
                t._renderPagination = () => {
                    if (!t._paginationEl) {
                        const p = opts.templates.pagination;
                        const totalPages = Math.ceil(st.total / opts.pageSize);
                        t._paginationEl = t.getDom(p.wrapper);
                        for (let i = 1; i <= totalPages; i++) {
                            t._paginationEl.appendChild(t.getDom(p.page.replace(/{page}/g, i)));
                        }
                        t.getDom(opts.parentPaging || t.list).appendChild(t._paginationEl);

                        // Event click page
                        t._onDOM(t._paginationEl, 'mousedown', (e) => {
                            e.preventDefault(); // chặn bubble blur input search (vì open đang là true)
                            const el = e.target.closest('.page-link');
                            if (!el) return;
                            const newPage = parseInt(el.dataset.page);
                            t.load(newPage, false); // load page mới, không append
                            el.closest('ul').querySelectorAll('li').forEach(li => li.classList.remove('active'));
                            el.parentNode.classList.add('active');
                        });
                    }
                };
                t.on('load_end', () => t._renderPagination());
            }
        });
    });

})(typeof window !== 'undefined' ? window : this);