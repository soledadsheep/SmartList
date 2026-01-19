; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.theme('bootstrap', {
        classMap: {
            container: 'form-control p-0',
            head: 'd-flex flex-wrap align-items-center gap-1 px-2 py-1',
            tags: 'd-flex flex-wrap gap-1',
            tag: 'badge bg-primary d-flex align-items-center',
            tagLabel: 'me-1',
            tagRemove: 'btn-close btn-close-white btn-sm ms-1',
            control: 'flex-grow-1',
            searchInput: 'form-control border-0 shadow-none p-0',
            list: 'dropdown-menu show w-100 p-0',
            items: 'list-group list-group-flush',
            item: 'list-group-item list-group-item-action',
        }
    });

})(typeof window !== 'undefined' ? window : this);