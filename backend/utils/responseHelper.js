const success = (res, statusCode, message, data, pagination = null) => {  const response = {
    success: true,
    message,
    data
  };
  
  if (pagination) response.pagination = pagination;
  
  res.status(statusCode).json(response);
};

const error = (res, statusCode, message) => {
  res.status(statusCode).json({
    success: false,
    message,
    data: null
  });
};

module.exports = { success, error };