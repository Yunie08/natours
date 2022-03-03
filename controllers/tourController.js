const Tour = require('../models/tourModel');
const APIFeatures = require('../utils/apiFeatures');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const factory = require('./handlerFactory');

// Set 5 best tours
// http://localhost:8000/api/v1/tours?limit=5&sort=-ratingsAverage,price&fiels=name,price,ratingsAverage,summary,difficulty
// => http://localhost:8000/api/v1/tours/top-5-tours
exports.aliasTopTours = (req, res, next) => {
  req.query.limit = '5';
  req.query.sort = '-ratingsAverage,price';
  req.query.fields = 'name,price,ratingsAverage,summary,difficulty';
  next();
};

exports.getAllTours = catchAsync(async (req, res, next) => {
  // Executing query after full filtering
  const features = new APIFeatures(Tour.find(), req.query)
    .filter()
    .sort()
    .limitFields()
    .paginate();
  // chaining works only because we return 'this' each time
  const tours = await features.query;

  // ** SEND RESPONSE **
  res.status(200).json({
    status: 'success',
    requestedAt: req.requestTime,
    results: tours.length,
    data: {
      tours,
    },
  });
});

exports.getTour = catchAsync(async (req, res, next) => {
  const tour = await Tour.findById(req.params.id).populate('reviews');
  // Tour.findOne({ _id: req.params.id })

  if (!tour) {
    return next(new AppError('No tour found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      tour,
    },
  });
});

exports.createTour = factory.createOne(Tour);
exports.updateTour = factory.updateOne(Tour);
exports.deleteTour = factory.deleteOne(Tour);

// AGGREGATION PIPELINE
exports.getTourStats = catchAsync(async (req, res, next) => {
  const stats = await Tour.aggregate([
    {
      $match: { ratingsAverage: { $gte: 4.5 } },
    },
    {
      $group: {
        //_id: null, // defined by what we want to group. Here null because we want the average rating of all tours
        //_id: '$difficulty', // will compute statistics for each difficulty level
        _id: { $toUpper: '$difficulty' }, // will compute statistics for each difficulty level AND display difficulty value in capital letter
        numTours: { $sum: 1 }, // for each document that will go through the aggregation pipeline, we simply add 1
        numRatings: { $sum: '$ratingsQuantity' },
        avgRating: { $avg: '$ratingsAverage' }, // $avg part of mongodb methods ... always add $ to field name
        avgPrice: { $avg: '$price' },
        minPrice: { $min: '$price' },
        maxPrice: { $max: '$price' },
      },
    },
    {
      // we can only use fields as defined in previous step
      $sort: { avgPrice: 1 }, // 1 for ascending order
    },
    // {
    //   $match: { _id: { $ne: 'EASY' } }, // _id is set to '$difficulty', so we remove results for the difficulty 'EASY'
    // },
  ]);
  res.status(200).json({
    status: 'success',
    data: {
      stats,
    },
  });
});
