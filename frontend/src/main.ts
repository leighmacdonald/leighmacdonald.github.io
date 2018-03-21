import 'whatwg-fetch' // ie polyfill for fetch()
import './../scss/app.scss'

export class EvtHandler {
    /**
     * Calls this.on{$event_type}(event) allowing this to refer to the object
     * instead of the inner closure.
     *
     * @param {Event} e
     */
    handleEvent(e: Event) {
        (this as any)['on' + e.type](e);
    }
}

export function toggleClasses(el: HTMLElement, added: string, removed: string) {
    el.classList.add(added);
    el.classList.remove(removed);
}

function startup() {
    jQuery(document).foundation();
}

document.addEventListener("DOMContentLoaded", startup);