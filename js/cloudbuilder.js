// COTC added all
function CloudBuilder(storageManager) {
  this.boardName = "score";
  this.maxScores = 5;
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

CloudBuilder.prototype.fetchHighScores = function(whenDone) {
  this.ensureLoggedIn(function() {
    var lb = this.clan.withGamer(this.gamerData).leaderboards();
    lb.getHighscores(this.boardName, 1, this.maxScores, function(err, result) {
      this.log("Got scores", err || result);
      whenDone(result.score.scores);
    }.bind(this));
  }.bind(this));
};

CloudBuilder.prototype.postScore = function(score, whenDone) {
  this.ensureLoggedIn(function() {
    console.log("Posting score " + score + " on board " + this.boardName);

    var lb = this.clan.withGamer(this.gamerData).leaderboards();
    lb.set(this.boardName, "hightolow", {"score": score, "info": "Game finished"}, whenDone);
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
