const admin = require("firebase-admin");
const fs = require('fs');
const serviceAccount = require("./serviceAccountKey.json");

// 获取命令行参数, 
let project_id = process.argv[2];
let export_dis_file = process.argv[3];
let collectionName = process.argv[4];
let subCollection = process.argv[5];

// 将数据库 URL 替换为自己的数据库地址(URL 地址, 请查看 README.md)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${project_id}.firebaseio.com`
});

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


results.then(dt => {
  getSubCollection(dt).then(() => {
    // Write collection to JSON file
    // 写入 collection (集合) 到 .json 文件中
    fs.writeFile(export_dis_file, JSON.stringify(data, null, 4), function (err) {
      if (err) {
        return console.log(err);
      }
      console.log("文件已保存!");
      console.log('---------------------\r\n' + JSON.stringify(data, null, 4) + '\r\n---------------------\r\n');
    });
  })
})

async function getSubCollection(dt) {
  for (let [key, value] of Object.entries([dt[collectionName]][0])) {
    if (subCollection !== undefined) {
      data[collectionName][key]['subCollection'] = {};
      await addSubCollection(key, data[collectionName][key]['subCollection']);
    }
  }
}

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
