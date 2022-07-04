

const path = require('path');
const utils = require('util');

const inquirer = require('inquirer');
const pathExists = require("path-exists");
const ora = require('ora');
const semver = require('semver');
const fse = require("fs-extra");
const download = require('download-git-repo');
const ejs = require('ejs');
const glob = require('glob');

const { isObject, spawnAsync } = require('../utils/utils');
const log = require('../utils/log');
const config = require('../config');
const { getTemplateInfo } = require('./getRequest');

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
    // 先校验项目模板 没有模板 还继续执行个啥
    let spinner;
    let result;
    // 获取项目模板
    try {
      spinner = ora('校验项目模板是否存在...')
      spinner.start()
      result = await getTemplateInfo();
    } catch (error) {
      spinner.stop();
      log.error('校验项目模板发生异常!');
    }

    if (!result || result.length < 1) {
      spinner.stop();
      log.error('暂无项目模板, 终止脚手架服务！');
      return
    }
    spinner.succeed();

    const templateList = this.templateList(result);
    log.verbose('项目模板信息', templateList)

    // 输入项目名称 
    if (this.projectName && !await this.checkProjectName(this.projectName)) {
      return;
    }

    // 没输入项目名称
    if (!this.projectName) {
      const { projectName } = await inquirer.prompt({
        type: 'input',
        name: 'projectName',
        default: 'my-app',
        message: '请输入你的项目名称'
      })

      this.projectName = projectName;

      if (!await this.checkProjectName(projectName)) return;
    }

    //
    const prompts = [];
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
      choices: templateList
    })

    const data = await inquirer.prompt(prompts)

    this.templateInfo = {
      projectName: this.projectName,
      ...data
    };

    log.verbose('模板信息', this.templateInfo)

    await this.downloadTemplate()

    await this.ejsRender();

    await this.install();
  }

  async downloadTemplate() {
    log.verbose('准备下载项目模板到本地')
    const templateUrl = `cqy-cli-template/${this.templateInfo.templateName}`;
    const projectPath = path.resolve(process.cwd(), this.templateInfo.projectName)
    const promiseDownload = utils.promisify(download)
    const spinner = ora('开始下载项目模板到本地... 请稍等')

    try {
      spinner.start()
      await promiseDownload(templateUrl, projectPath);
      spinner.succeed();
      log.success('下载项目模板成功!')
      this.projectPath = projectPath;
    } catch (error) {
      spinner.stop();
      log.error('error', error.message)
      return;
    }
  }

  async checkIsDir() {
    // 校验 当前文件夹下是否存在文件
    const cwd = process.cwd();
    const filePath = path.resolve(cwd, this.projectName);
    this.filePath = filePath;
    log.verbose('检验是否存在', filePath)
    return await pathExists(filePath)
  }

  async checkProjectName(projectName) {
    // 校验是否存在重复文件夹
    const bl = await this.checkIsDir();

    // 存在
    if (bl) {
      // 没输入force
      if (!this.force) {
        // 再次进行询问
        const { isDelDir } = await inquirer.prompt({
          type: 'confirm',
          name: 'isDelDir',
          default: false,
          message: `当前目录存在${projectName}文件夹,是否继续执行(继续执行会先删除${projectName}文件夹)`
        })
        if (!isDelDir) return false;
      }

      await this.delDir(this.projectName)
    }

    return true;
  }


  async delDir(file) {
    await fse.remove(this.filePath)
  }

  templateList(templates) {
    return templates.map(template => template.name)
  }

  ejsRender() {
    const ejsInfo = this.templateInfo;
    const projectPath = this.filePath
    const ignore = ['node_modules/**']
    return new Promise((resolve, reject) => {
      glob(
        '**',
        // 'package.json',
        {
          cwd: projectPath,
          ignore,
          nodir: true
        },
        (err, files) => {
          if (err) reject(err)
          Promise.all(files.map(file => {
            const filePath = path.join(projectPath, file)
            return new Promise((resolve1, reject1) => {
              ejs.renderFile(filePath, ejsInfo, (err, result) => {
                if (err) {
                  reject1(err);
                } else {
                  // 写入文件
                  fse.writeFileSync(filePath, result);
                  resolve1(result)
                }
              })
            })
          })).then(() => {
            resolve();
          }).catch((e) => {
            reject(e)
          })

        })
    })
  }

  async install() {
    log.info('开始安装项目所需依赖,请稍等...')
    const result = await spawnAsync('npm', 'install', {
      stdio: 'inherit',
      cwd: this.filePath
    }).catch((err) => {
      log.error(err.message);
      return;
    })

    if (result !== 0) {
      log.warn('自带安装依赖失败, 请自行进行安装!')
    }

  }

}


module.exports = Execute;