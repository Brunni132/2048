window.fakeStorage = {
  _data: {},

  setItem: function (id, val) {
    return this._data[id] = String(val);
  },

  getItem: function (id) {
    return this._data.hasOwnProperty(id) ? this._data[id] : undefined;
  },

  removeItem: function (id) {
    return delete this._data[id];
  },

  clear: function () {
    return this._data = {};
  }
};

function LocalStorageManager() {
  this.gameStateKey     = "gameState";
  this.noticeClosedKey  = "noticeClosed";
  this.gamerDataKey     = "gamerData";

  var supported = this.localStorageSupported();
  this.storage = supported ? window.localStorage : window.fakeStorage;
}

LocalStorageManager.prototype.localStorageSupported = function () {
  var testKey = "test";
  var storage = window.localStorage;

  try {
    storage.setItem(testKey, "1");
    storage.removeItem(testKey);
    return true;
  } catch (error) {
    return false;
  }
};

LocalStorageManager.prototype.setNoticeClosed = function (noticeClosed) {
  this.storage.setItem(this.noticeClosedKey, JSON.stringify(noticeClosed));
};

LocalStorageManager.prototype.getNoticeClosed = function () {
  return JSON.parse(this.storage.getItem(this.noticeClosedKey) || "false");
};

// COTC added
LocalStorageManager.prototype.getGamerData = function() {
    var dataJSON = this.storage.getItem(this.gamerDataKey);
    return dataJSON ? JSON.parse(dataJSON) : null;
};

LocalStorageManager.prototype.setGamerData = function(gamerData) {
  this.storage.setItem(this.gamerDataKey, JSON.stringify(gamerData));
};
