import Datastore from 'lowdb'
import FileSync from 'lowdb/adapters/FileSync'
import path from 'path'
import fs from 'fs-extra'
import { app, remote } from 'electron'
import {version} from '../../package.json';


const APP = process.type === 'renderer' ? remote.app : app

const STORE_PATH = APP.getPath('userData')

if (process.type !== 'renderer') {
    if (!fs.pathExistsSync(STORE_PATH)) { // 如果不存在路径
      fs.mkdirpSync(STORE_PATH) // 就创建
    }
  }

const adapter = new FileSync(path.join(STORE_PATH, '/girls-reptile.json'))

const db = Datastore(adapter)

if (!db.has('config').value()) {
  db.set('config', {
      timeout:10,
      saveDir:APP.getPath('downloads'),
      diffDirectory:true,
      siteIndex:0,
      tagIndex:0
  }).write() // 不存在就创建
}else{
  let config = db.get('config').value()
  if(config.diffDirectory==undefined){
    config.diffDirectory = true
  }
  db.set('config',config).write()
}

export default db // 暴露出去