// COTC added all
function CloudBuilder(storageManager) {
  this.boardName = "score";
  this.maxScores = 5;
  this.gameStateKey = "gamestate";
  this.storageManager = storageManager;

  this.consoleNode = document.querySelector("#console");
}

CloudBuilder.prototype.setup = function(whenDone) {
  this.clan = Clan('testgame-key', 'testgame-secret');
  this.log("CloudBuilder set-up!");

  // We need to log in if not done already
  this.gamerData = this.storageManager.getGamerData();
  if (!this.gamerData) {
    this.loginAnonymously(whenDone);
  } else {
    this.log("Reused login data", this.gamerData);
    if (whenDone) {
      whenDone(null, this.gamerData);
    }
  }
};

CloudBuilder.prototype.ensureLoggedIn = function(whenDone) {
  if (!this.gamerData) {
    return this.log("Rejected since we are not logged in");
  }
  whenDone();
};

CloudBuilder.prototype.loginAnonymously = function(whenDone) {
  this.log("Logging in anonymously…");
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

CloudBuilder.prototype.loginWithId = function(network, gamerId, gamerSecret, options, whenDone) {
  this.log("Logging in with gamer ID " + gamerId);
  if (!whenDone && options) {
    whenDone = options; options = null;
  }
  
  this.clan.login(network, gamerId, gamerSecret, options, function (err, gamer) {
    this.log("Logged in!", err || gamer);
    // The callback can return true to prevent login data to be saved
    if (whenDone && whenDone(err, gamer)) {
      this.log("Login discarded");
      return;
    }
    // Store credentials for later use
    if (!err) {
      this.gamerData = gamer;
      this.storageManager.setGamerData(gamer);
    }
  }.bind(this));
};

CloudBuilder.prototype.convertAccount = function(network, gamerId, gamerSecret, whenDone) {
  this.ensureLoggedIn(function() {
    this.clan.withGamer(this.gamerData).convertTo(network, gamerId, gamerSecret, function (err, result) {
      this.log("Converted account!", err || result);
      if (!err) {
        // Things changed, we need to log in back again to fetch the modified profile
        this.loginWithId(this.gamerData.network, this.gamerData.gamer_id, this.gamerData.gamer_secret, whenDone);
      }
      else if (whenDone) { whenDone(err, result); }
    }.bind(this));
  }.bind(this));
};

CloudBuilder.prototype.logout = function(whenDone) {
  // We do not really support logging out, we always need an anonymous account, so just create one instead!
  this.storageManager.setGamerData(null);
  this.gamerData = null;
  this.loginAnonymously(whenDone);
};

CloudBuilder.prototype.checkAndRelog = function(err, whenDone) {
  if (err && err.status == 401) {
    this.log("Invalid login token, creating a new anonymous login");
    this.storageManager.setGamerData(null);
    this.gamerData = null;
    this.loginAnonymously(whenDone);
    return true;
  }
  return false;
};

CloudBuilder.prototype.changeName = function(newName, whenDone) {
  this.ensureLoggedIn(function() {
    var profile = this.clan.withGamer(this.gamerData).profile();
    
    profile.set({"displayName": newName}, function(err, result) {
      this.log("Changed name", err || result);
      if (!err) {
        // The name changed, we need to log in back again to fetch the modified profile
        this.loginWithId(this.gamerData.network, this.gamerData.gamer_id, this.gamerData.gamer_secret, whenDone);
      }
    }.bind(this));
  }.bind(this));
};

CloudBuilder.prototype.fetchHighScores = function(whenDone) {
  this.ensureLoggedIn(function() {
    var lb = this.clan.withGamer(this.gamerData).leaderboards();
    lb.getHighscores(this.boardName, 1, this.maxScores, function(err, result) {
      this.log("Got scores", err || result);
      // Might have failed, try again in that case
      if (!this.checkAndRelog(err, this.fetchHighScores.bind(this, whenDone))) {
        whenDone(result.score.scores);
      }
    }.bind(this));
  }.bind(this));
};

CloudBuilder.prototype.postScore = function(score, whenDone) {
  this.ensureLoggedIn(function() {
    var lb = this.clan.withGamer(this.gamerData).leaderboards();
    lb.set(this.boardName, "hightolow", {"score": score, "info": "Game finished"}, function(err, result) {
      this.log("Posted score " + score + " on board " + this.boardName, err || result);
      if (whenDone) { whenDone(err, result); }
    }.bind(this));
  }.bind(this));
};

CloudBuilder.prototype.getGameState = function(callback) {
  this.ensureLoggedIn(function() {
    var vfs = this.clan.withGamer(this.gamerData).gamervfs();
    vfs.get(this.gameStateKey, callback);
  }.bind(this));
};

CloudBuilder.prototype.setGameState = function(value, callback) {
  if (!callback) { callback = function() {}; }
  this.ensureLoggedIn(function() {
    var vfs = this.clan.withGamer(this.gamerData).gamervfs();
    this.log("Saving game state", value);
    if (value) {
      vfs.set(this.gameStateKey, value, callback);
    } else {
      vfs.del(this.gameStateKey, callback);
    }
  }.bind(this));
};

CloudBuilder.prototype.clearGameState = function(callback) {
  this.setGameState(null, callback);
};

CloudBuilder.prototype.log = function(text, object) {
  this.consoleNode.innerHTML += text + "\n";
  if (object) {
    this.consoleNode.innerHTML += "<span class=\"object\">->> " + JSON.stringify(object, null, 4) + "</span>\n";
  }
  // Also output on the system console
  object ? console.log(text, object) : console.log(text);
  // Scroll to the bottom
  this.consoleNode.scrollTop = this.consoleNode.scrollHeight;
};
