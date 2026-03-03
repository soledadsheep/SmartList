; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.theme('bootstrap', function (instance, cfgs = {}) {

        // --------------------------------
        // Inject CSS
        // --------------------------------
        if (!document.getElementById('sl-bootstrap-theme')) {
            const style = document.createElement('style');
            style.id = 'sl-bootstrap-theme';
            style.textContent = `
                .cursor-default {
                    cursor: default;
                }
            `;
            document.head.appendChild(style);
        }

        return {
            classMap: {
                container: 'form-control p-0 sl-bootstrap-container',
                head: 'd-flex flex-wrap align-items-center gap-1 px-2 py-2',
                tags: 'd-flex flex-wrap gap-1',
                tag: 'badge bg-primary d-flex align-items-center cursor-default',
                tagLabel: 'me-1',
                tagRemove: 'btn-close btn-close-white btn-sm ms-1',
                control: 'flex-grow-1',
                searchInput: 'form-control border-0 shadow-none p-0',
                list: 'dropdown-menu p-0 overflow-y-auto',
                items: 'list-group list-group-flush',
                item: 'list-group-item list-group-item-action cursor-default',
                noResults: 'px-3 py-2',
            }
        };
    });

})(typeof window !== 'undefined' ? window : this);