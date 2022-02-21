const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please tell us your name!'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email'],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email'],
  },
  photo: String,
  role: {
    type: String,
    enum: ['user', 'guide', 'lead-guide', 'admin'],
    default: 'user',
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 8,
    select: false, // the (hashed) password won't be displayed in query results
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password'],
    validate: {
      // only works on CREATE and SAVE !!! => so always use save even for updating
      validator: function (el) {
        return el === this.password;
      },
      message: 'Passwords are not the same',
    },
  },
  passwordChangedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  active: {
    type: Boolean,
    default: true,
    select: false,
  },
});

userSchema.pre('save', async function (next) {
  // if the password has not been modified => next
  if (!this.isModified('password')) return next();

  // else, we hash the new password and delete passwordConfirm field
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

userSchema.pre('save', function (next) {
  // mongoose properties isModified and isNew
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000; // -1s to compensate for the fact that sometimes the token is issued before the passwordChangedAt is actually defined (which would make the token invalid !!)
  next();
});

//------------ INSTANCE METHODS - Available on all Documents of a certain collections -----------------//

// CHECK PASSWORD
userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// CHECK IF PASSWORD HAS BEEN CHANGED SINCE TOKEN GENERATION
userSchema.methods.changedPasswordAfter = function (JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );
    console.log(changedTimestamp, JWTTimestamp);
    // true if the password has been modified after the token has been issued
    return JWTTimestamp < changedTimestamp;
  }

  // False means NOT changed
  return false;
};

// CREATE PASSWORD RESET TOKEN
userSchema.methods.createPasswordResetToken = function () {
  // token is a temporary password before user can change it
  // we still need to encrypt it to store it in our DB, we hashing doesn't need to be as strong
  // crypto is a built-in package
  const resetToken = crypto.randomBytes(32).toString('hex');

  // encryption method . variable to encrypt . actual encryption
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  console.log({ resetToken }, this.passwordResetToken);

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000; // token expires 10mn after it's generated

  // return the non-encrypted token
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
