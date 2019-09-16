/**
 * QinYUN575
 * 
 * 2019.09.12
 * 
 */
`use strict`;

// 引入模块
const fs = require('fs');
const admin = require('firebase-admin');

// 导入 firebase-admin key
const firebase_admin_key = require('./firebase_admin_key.json');


admin.initializeApp({
    credential: admin.credential.cert(firebase_admin_key),
    databaseURL: `https://smarthome-251101.firebaseio.com`
});


// 处理命令行参数
const argv = require('yargs')
    .option({
        filename: {
            alias: 'f',
            demandOption: true,
            describe: 'Export file name.',
            type: 'string'
        },
        projectId: {
            alias: 'p',
            demandOption: true,
            describe: 'Google Cloud Project ID.',
            type: 'string'
        },
        url: {
            alias: 'u',
            demandOption: false,
            describe: 'firebase data URL.',
            type: 'string'
        },
        collection: {
            alias: 'c',
            demandOption: true,
            describe: 'Export data for collection name.',
            type: 'string'
        },
        subCollection: {
            alias: 's',
            demandOption: false,
            describe: 'Export data for SubCollection name.',
            type: 'string'
        },
    }
    )
    .help()
    .strict()
    .argv;

let filename = argv.filename;
let projectId = argv.projectId;
let collectionName = argv.collection;
let subCollection = argv.subCollection;

console.log('\n---------------------------------------------\n');
console.log('配置:');
console.log(`\tExport File      : ${filename}`);
console.log(`\tProject Id       : ${projectId}`);
console.log(`\tCollection       : ${collectionName}`);
console.log(`\tSubCollection    : ${subCollection}`);
console.log('\n---------------------------------------------\n');

let db = admin.firestore();
db.settings({ timestampsInSnapshots: true });

let data = {};
data[collectionName] = {};
// 遍历抓取数据
let results = db.collection(collectionName)
  .get()
  .then(snapshot => {
    snapshot.forEach(doc => {
      data[collectionName][doc.id] = doc.data();
    })
    return data;
  })
  .catch(error => {
    console.log(error);
  })
  .then(dt => {
  getSubCollection(dt).then(() => {
    // Write collection to JSON file
    // 写入 collection (集合) 到 .json 文件中
    fs.writeFile(filename, JSON.stringify(data, null, 4), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log(`文件已保存![${filename}]`);
    //   console.log('---------------------\r\n' + JSON.stringify(data, null, 4) + '\r\n---------------------\r\n');
    });
  })
})

// 获取子 collection
async function getSubCollection(dt) {
  for (let [key, value] of Object.entries([dt[collectionName]][0])) {
    if (subCollection !== undefined) {
        //FIX: 修改子 collection
      data[collectionName][key][subCollection] = {};
      // 
      await addSubCollection(key, data[collectionName][key][subCollection]);
    }
  }
}

/**
 * 键值 数据
 * @param {*} key 
 * @param {*} subData 
 */
function addSubCollection(key, subData) {
  return new Promise(resolve => {
    db.collection(collectionName).doc(key).collection(subCollection).get()
      .then(snapshot => {
        snapshot.forEach(subDoc => {
          subData[subDoc.id] = subDoc.data();
          resolve('Added data');
        })
      })
  })
}
