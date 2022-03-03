const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// ...allowedFields will create an array with all arguments after obj
const filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  // Object.keys(obj) => array with all the keys from obj object
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

// GET ALL USERS
exports.getAllUsers = catchAsync(async (req, res) => {
  const users = await User.find();

  // ** SEND RESPONSE **
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: users.length,
    data: {
      users,
    },
  });
});

// UPDATE ME
exports.updateMe = catchAsync(async (req, res, next) => {
  // 1) Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(
      new AppError(
        'This route is not for password updates. Please use /updateMyPassword',
        400
      )
    );
  }
  // 2) Filtered out unwanted field names that are not allow to be updated
  const filteredBody = filterObj(req.body, 'name', 'email');

  // 3) Update user document
  //// Here we can use findByIdAndUpdate because we do not need to check password or token (presave validation methods)
  //// BUT we do not want to use user.save({ validateBeforeSave: false })
  //// because this time we deal with user input so we NEED to use model validation !!
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true,
  });

  res.status(200).json({
    status: 'success',
    data: {
      user: updatedUser,
    },
  });
});

// DELETE ME
// Not a good practice to just deactivate when user wants to delete their data. Will modify later !
exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndUpdate(req.user.id, { active: false });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

exports.getUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

exports.createUser = (req, res) => {
  res.status(500).json({
    status: 'error',
    message: 'This route is not yet defined',
  });
};

// Do NOT update passwords with this!
exports.updateUser = factory.updateOne(User);
exports.deleteUser = factory.deleteOne(User);
