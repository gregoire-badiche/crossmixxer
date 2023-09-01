class Waiter {
    TO_WAIT = 1;
    state = 0;
    hascallbacked = false;
    callback = () => {};

    /**
     * @param {() => void} fn
     */
    set onready(fn) {
        if(this.hascallbacked == false) {
            this.callback = fn;
        } else {
            this.callback = fn;
            fn();
        }
    };
    update() {
        this.state += 1;
        if(this.state == this.TO_WAIT) {
            this.callback();
            this.hascallbacked = true;
        }
    };
}

module.exports = new Waiter();