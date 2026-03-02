; (function (root) {
    if (!root.SmartList) return;

    root.SmartList.plugin('caret', function (cfgs = {}) {
        const t = this, s = t.settings, st = t.state;

        const cfg = Object.assign({
            caretClass: 'sl-cb',
            position: 'end',
            icon: "data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16'%3e%3cpath fill='none' stroke='%23343a40' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='m2 5 6 6 6-6'/%3e%3c/svg%3e",
            rotateDeg: 180,
            duration: 200
        }, cfgs);

        // --------------------------------
        // Inject CSS
        // --------------------------------
        if (!document.getElementById('sl-caret-style')) {
            const style = document.createElement('style');
            style.id = 'sl-caret-style';
            style.textContent = `
                .${cfg.caretClass} {
                    width: 20px;
                    height: 12px;
                    cursor: pointer;
                    background-image: url("${cfg.icon}");
                    background-repeat: no-repeat;
                    background-position: center;
                    background-size: contain;
                    transition: transform ${cfg.duration}ms cubic-bezier(.4,0,.2,1);
                    transform-origin: center;
                }
                .${cfg.caretClass}.open {
                    transform: rotate(${cfg.rotateDeg}deg);
                }
            `;
            document.head.appendChild(style);
        }

        // -------------------------
        // Inject caret vào control
        // -------------------------
        t.on('init', () => {
            t.caret = document.createElement("span");
            t.caret.className = cfg.caretClass;

            if (cfg.position === "start") t.head.prepend(t.caret)
            else t.head.appendChild(t.caret)
        });

        t.on('dropdown_open', () => {
            t.caret?.classList.add('open');
        })

        t.on('dropdown_close', () => {
            t.caret?.classList.remove('open');
        })
    });

})(typeof window !== 'undefined' ? window : this);