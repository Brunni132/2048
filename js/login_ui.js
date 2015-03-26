// COTC added
function LoginUi(storageManager, cloudBuilder) {
  this.storageManager = storageManager;
  this.cloudBuilder = cloudBuilder;

  this.loginStateChanged = new ObservableEvent();
  this.loginStateChanged.onEvent(this.updateUi.bind(this));

  this.logoutButton = document.querySelector(".logout-button");
  this.loginEmailButton = document.querySelector(".login-email-button");

  // Login modal dialog UI elements
  this.loginEmail = document.querySelector("#loginEmailForm .email-input");
  this.loginPassword = document.querySelector("#loginEmailForm .password-input");
  this.bindButtonPress("#loginEmailForm .login-button", this.doLoginWithEmail);
  this.bindButtonPress("#loginEmailForm .register-button", this.doRegisterWithEmail);
  this.bindButtonPress(".logout-button", this.doLogout);
}

LoginUi.prototype.bindButtonPress = function (selector, fn) {
  var button = document.querySelector(selector);
  button.addEventListener("click", fn.bind(this));
  button.addEventListener(this.eventTouchend, fn.bind(this));
};

LoginUi.prototype.doLoginWithEmail = function(event) {
  // Check its validity first
  this.cloudBuilder.loginWithId("email", this.loginEmail.value, this.loginPassword.value, {"preventRegistration": true}, function(err, gamerData) {
    if (err) {
      alert("Log in failed, please check your credentials or use the register button to create a new account.");
      return true;
    }
    // There is a danger in leaving an anonymous account behind as it is not recoverable
    if (this.isAnonymous()) {
      var currentGamerData = this.storageManager.getGamerData();
      if (!confirm("You are about to log in with an e-mail account, losing the current " + currentGamerData.profile.displayName + " account.")) {
        return true;
      }
    }
    alert("Logged in as " + this.loginEmail.value + "!");
    this.didLoginWithEmail();
    return false;
  }.bind(this));
};

LoginUi.prototype.didLoginWithEmail = function() {
  // Wait the end of the current event handling chain
  setTimeout(this.loginStateChanged.emit.bind(this.loginStateChanged), 0);
  // Close the login windows
  location = "#close";
};

LoginUi.prototype.doRegisterWithEmail = function(event) {
  var whenDone = function(err, gamerData) {
    if (err) {
      alert("Registration failed: " + err.message + ".");
      return true;
    }
    alert(this.isAnonymous() ? "Your guest account is now associated to " + this.loginEmail.value + "!" : "Registration completed!");
    this.didLoginWithEmail();
    return false;
  };
  if (this.isAnonymous()) {
    // We have an anonymous account, just promote it to an e-mail one
    this.cloudBuilder.convertToEmailAccount(this.loginEmail.value, this.loginPassword.value, whenDone.bind(this));
  }
  else {
    // Simply log in
    this.cloudBuilder.loginWithId("email", this.loginEmail.value, this.loginPassword.value, whenDone.bind(this));
  }
};

LoginUi.prototype.doLogout = function(event) {
  if (confirm("Do you really want to log out? All your progress will be reseted.")) {
    this.cloudBuilder.logout(function(err, result) {
      if (!err) {
        this.loginStateChanged.emit();
      }
    }.bind(this));
  }
};

LoginUi.prototype.isAnonymous = function() {
  return this.storageManager.getGamerData().network === "anonymous";
};

LoginUi.prototype.setupDone = function() {
  this.loginStateChanged.emit();
};

LoginUi.prototype.updateUi = function() {
  this.logoutButton.style.display = this.isAnonymous()? "none" : "inline-block";
  this.loginEmailButton.style.display = this.isAnonymous()? "inline-block" : "none";
};
