class Events {
	constructor () {
		this.listenners = {};

		// debug,
		this.dupsCounter = 0;
		this.dups = {};
	}

	on (event, fn) {
		const listenners = this.listenners[event] =
			this.listenners[event] || [];

		if (this.listenners[event].indexOf(fn) === -1) {
			listenners.push(fn);
		}
	}

	off (event, fn) {
		const listenners = this.listenners[event];
		if (listenners) {
			if (fn) {
				const index = listenners.indexOf(fn);
				if (index !== -1) {
					listenners.splice(index, 1);
				}
			}

			if (!fn || !listenners || !listenners.length) {
				delete this.listenners[event];
			}
		}
	}

	trigger (event, value) {
		const listenners = this.listenners[event];

		if (listenners) {
			for (let i = 0; i < listenners.length; i++) {
				listenners[i](value);
			}
		}

	}
}

module.exports = Events;
