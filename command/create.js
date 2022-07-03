

const Execute = require("../execute");
const log = require('../utils/log');

function create(projectName, cmd) {
  // if (!projectName) {
  //   throw new Error('create 缺少项目名称!');
  // }
  log.verbose('command/create/projectName', projectName)
  log.verbose('command/create/cmd', cmd)

  const exec = new Execute({
    projectName,
    force: !!cmd.force
  })

  exec.startExec();

}


module.exports = create;