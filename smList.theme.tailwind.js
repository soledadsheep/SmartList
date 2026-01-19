; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.theme('tailwind', {
        classMap: {
            container: 'relative w-full border rounded-md bg-white text-sm',
            head: 'flex flex-wrap items-center gap-1 px-2 py-1',
            tags: 'flex flex-wrap gap-1',
            tag: 'flex items-center bg-blue-500 text-white rounded px-2 py-0.5',
            tagLabel: 'mr-1',
            tagRemove: 'ml-1 cursor-pointer opacity-70 hover:opacity-100',
            control: 'flex-1 min-w-[4rem]',
            searchInput: 'w-full outline-none border-0 focus:ring-0',
            list: 'absolute left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow max-h-60 overflow-auto',
            items: 'divide-y',
            item: 'px-3 py-2 cursor-pointer hover:bg-gray-100',
        }
    });

})(typeof window !== 'undefined' ? window : this);