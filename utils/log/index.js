
const log = require('npmlog');
const config = require('../../config')

// 判断环境变量  是否开启debug模式
log.level = process.env[config.log_debug] ? process.env[config.log_debug] : 'info';

// 新增success 方法
log.addLevel('success', 2000, { fg: 'green', bold: true })

module.exports = log;