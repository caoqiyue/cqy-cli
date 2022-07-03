'use strict';

const { Command } = require('commander');
const pkg = require('../../package.json');
const create = require('../../command/create.js');
const log = require('../../utils/log');
const config = require('../../config');



function core() {

  // commander 初始化命令
  try {
    registerCommand();
  } catch (error) {
     log.error(error.message)
  }
}

function registerCommand() {
  const program = new Command();
  // 配置全局命令
  program
    .name('cqy-cli')
    .usage('<command> [options]')
    .option('-d --debug', '是否开启调试模式', false)
    .version(pkg.version);

  program
    .command('create [projectName]')
    .option('-f, --force', '是否强制初始化项目')
    .action(create);

  // 监听debug 开启修改环境变量
  program.on('option:debug', function () {
    if (program.opts() && program.opts().debug) {
      process.env[config.log_debug] = 'verbose'
    }
    log.level = process.env[config.log_debug]
    log.verbose('开启debug模式成功!')
  });

  program.parse(process.argv);
}


module.exports = core