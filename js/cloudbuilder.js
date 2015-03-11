// COTC added all
function CloudBuilder(storageManager) {
  this.storageManager = storageManager;

  this.consoleNode = document.querySelector("#console");

  this.setup();
}

CloudBuilder.prototype.setup = function() {
  this.clan = Clan('testgame-key', 'testgame-secret');
  this.log("CloudBuilder set up!");

  // We need to log in if not done already
  this.gamerData = this.storageManager.getGamerData();
  if (!this.gamerData) {
    this.loginAnonymously(function(err, gamerData) {});
  } else {
    this.log("Reused login data", this.gamerData);
  }
};

CloudBuilder.prototype.ensureLoggedIn = function(whenDone) {
  if (!this.gamerData) {
    return this.log("Rejected since we are not logged in");
  }
  whenDone();
};

CloudBuilder.prototype.loginAnonymously = function(whenDone) {
  this.log("Trying to log in…");
  this.clan.login(null, function (err, gamer) {
    // Store credentials for later use
    if (!err) {
      this.gamerData = gamer;
      this.storageManager.setGamerData(gamer);
      this.log("Logged in successfully!", gamer);
    } else {
      this.log("Failed to login", err);
    }
    // Callback
    if (whenDone) {
      whenDone(err, gamer);
    }
	}.bind(this));
};

CloudBuilder.prototype.log = function(text, object) {
  this.consoleNode.innerHTML += text + "\n";
  if (object) {
    this.consoleNode.innerHTML += "->> " + JSON.stringify(object, null, 4) + "\n";
  }
  // Also output on the system console
  object ? console.log(text, object) : console.log(text);
  // Scroll to the bottom
  this.consoleNode.scrollTop = this.consoleNode.scrollHeight;
}
