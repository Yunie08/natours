module.exports = (fn) => {
  // return a function so that createTour remains a function and not the results of the called catchAsync function
  return (req, res, next) => {
    fn(req, res, next).catch(next); //catch(next) <=> catch(err => next(err)) because catch only takes err argument
  };
};
