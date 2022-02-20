class APIFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString;
  }

  filter() {
    // 1A) Filtering
    // Method 1 : .find
    // Best because req.query has the perfect format
    // However we need to remove the parameters not used for filtering (such as pages)

    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // 1B) Advanced filtering

    // req.query:  { difficulty: 'easy', duration: { gte: '5' }}
    // what is needed for filtering { difficulty: 'easy', duration: { $gte: 5 }}
    // gte => $gte, gt => $gt, lte => $lte, lt => $lt
    // \b...\b => exact string  //  /g => several occurences
    // replace accept callback function
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`);

    this.query = this.query.find(JSON.parse(queryStr));
    return this;
  }

  sort() {
    if (this.queryString.sort) {
      // incoming query ?sort=-price,ratingsAverage
      // what we need sort('price ratingsAverage')
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
      // default sorting by descending creation date
    } else {
      // Always double default sorting with _id which is truly unique
      // Solves skip issue
      this.query = this.query.sort('-createdAt _id');
    }
    return this;
  }

  // 3) Field limiting - To reduce bandwidth consumed by each request
  // incoming query ?fields=name,duration,difficulty,price
  // what mongoose need to sort('name duration difficulty price')
  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // '-__V' EXCLUDE this field
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // 4) Pagination
  // ?page=2&limit=10 , 1-10 for page 1, 11-20 for page 2...
  // ==> query = query.skip(10).limit(10)
  paginate() {
    const page = this.queryString.page * 1 || 1;
    const limit = this.queryString.limit * 1 || 100;
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }
}
module.exports = APIFeatures;
