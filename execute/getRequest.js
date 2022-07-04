
const request = require('../utils/api');


function getTemplateInfo() {
  return request({
    // url: 'https://gitee.com/api/v5/users/cqy/repos'
    url: 'https://api.github.com/orgs/cqy-cli-template/repos'
  })
}

module.exports = {
  getTemplateInfo
}