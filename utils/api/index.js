

const axios = require('axios');

const request = axios.create({
  timeout: 10000
})

request.interceptors.response.use(response => {
  return response.data
}, error => {
  Promise.reject(error)
})


module.exports = request;