const express = require('express');
const tourController = require('../controllers/tourController');
const authController = require('../controllers/authController');

// const checkbody = require('./../middleware/checkbody');

const router = express.Router();

// Applied only when there is an id parameter in URL
// router.param('id', tourController.checkId);

router
  .route('/top-5-tours')
  .get(tourController.aliasTopTours, tourController.getAllTours);

router.route('/tour-stats').get(tourController.getTourStats);

router
  .route('/')
  .get(authController.protect, tourController.getAllTours)
  .post(tourController.createTour);

router
  .route('/:id')
  .get(tourController.getTour)
  .patch(tourController.updateTour)
  .delete(tourController.deleteTour);

module.exports = router;
