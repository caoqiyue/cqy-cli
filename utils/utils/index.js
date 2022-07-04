'use strict';


function isObject(o) {
  return Object.prototype.toString.call(o) === '[object Object]'
}


// 操作系统兼容
function spawn(command, args, options) {
  const win32 = process.platform === 'win32';
  const cmd = win32 ? 'cmd' : command;
  const cmdArgs = win32 ? ['/c'].concat(command, args) : args;
  return require('child_process').spawn(cmd, cmdArgs, options || {})
}

function spawnAsync(command, args, options) {
  return new Promise((resolve, reject) => {
      const p = spawn(command, args, options);
      p.on('error', e => {
          reject(e);
      })
      p.on('exit', c => {
          resolve(c);
      })
  })
}

module.exports = {
  isObject, spawnAsync
}