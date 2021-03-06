class EventBus {
  constructor() {
    this.listeners = {};
  }

  subscribe(event, callback) {
    const isArray = Array.isArray(this.listeners[event]);

    if (isArray) {
      this.listeners[event].push(callback);
    } else {
      this.listeners[event] = [callback];
    }
  }

  unsubscribe(event, callback) {
    const index = this.listeners[event].findIndex((cb) => cb === callback);

    this.listeners[event].splice(index, 1);
  }

  async emit(event, ...args) {
    const hasEventListener = this.listeners[event];

    if (hasEventListener) {
      const promises = [];

      this.listeners[event].forEach((callback) => promises.push(callback(...args)));

      await Promise.all(promises);
    }
  }
}

export default EventBus;
