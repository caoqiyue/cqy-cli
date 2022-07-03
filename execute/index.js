
const inquirer = require('inquirer');
const log = require('../utils/log');
const { isObject } = require('../utils/utils');
const semver = require('semver');
const config = require('../config');

class Execute {
  constructor(options) {
    if (!options) {
      throw new Error('Execute options 为空!')
    }
    if (!isObject(options)) {
      throw new Error('Execute options 必须是对象!')
    }
    this.force = options.force;
    this.projectName = options.projectName;

  }

  async startExec() {
    const prompts = [];
    if (!this.projectName) {
      prompts.push({
        type: 'input',
        name: 'projectName',
        default: 'my-app',
        message: '请输入你的项目名称'
      })
    }

    prompts.push({
      type: 'input',
      name: 'projectVersion',
      message: '请输入你的项目版本',
      default: '1.0.0',
      choices: config.project_list,
      validate: function (v) {
        const done = this.async();
        setTimeout(function () {
          if (!(!!semver.valid(v))) {
            done('请输入合法的版本号');
            return;
          }
          done(null, true);
        }, 0);
      },
      filter: function (v) {
        if (!!semver.valid(v)) {
          return semver.valid(v)
        }
        return v
      }
    })

    prompts.push({
      type: 'list',
      name: 'templateName',
      message: '请选择需要下载的项目模板',
      choices: config.project_list
    })

    const data = await inquirer.prompt(prompts)
    
    this.templateInfo = {
      projectName: this.projectName,
      ...data
    };
    
    log.verbose('模板信息', this.templateInfo)

    this.downloadTemplate()
  }

  downloadTemplate() {
    log.verbose('开始下载项目模板到本地')
  }
}


module.exports = Execute;