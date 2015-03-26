// COTC added
function ObservableEvent() {}

ObservableEvent.prototype.onEvent = function(callback) {
  if (!this.events) {
    this.events = [];
  }
  this.events.push(callback);
};

ObservableEvent.prototype.emit = function(data) {
  if (this.events) {
    this.events.forEach(function (callback) {
      callback(data);
    });
  }
};
