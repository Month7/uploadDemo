const express = require('express');
// const multipart = require('connect-multiparty'); // form-data 格式的中间件支持
const path = require('path')
// const multipartMiddleware = multipart();
const formidable = require('formidable')
const bodyParser = require('body-parser') 
const concat = require('concat-files')
const fs = require('fs-extra')
const app = express();


// 处理静态资源
app.use(express.static(path.join(__dirname)))

// 获取post参数
app.use(bodyParser.json()) 

app.all('*',(req,res,next)=>{
  res.header('Access-Control-Allow-Origin','*');
  res.header('Access-Control-Allow-Headers',
  'Content-Type,Content-Length,Authorization,Accept,X-Requested-With')
  res.header('Access-Control-Allow-Methods','PUT,POST,GET,DELETE,OPTIONS')
  next();
})

app.get('/',(req,res)=>{
  res.send('如果你看到这个页面,说明尹铮的断点续传demo服务端运行正常!');
})

// 合并文件
const mergeFiles = async (toSrc,newFileName) => {
  ensureDir()
  let fromArr = await listDir(`${__dirname}/uploads${dir}`)
  let arr = new Array(fromArr.length)
  for(let i =0;i<fromArr.length;i++){
    for(let j=0;j<fromArr.length;j++){
      if(Number(fromArr[j]) === i) arr[i] = `${__dirname}/uploads${dir}/${fromArr[j]}`
    }
  }
  return new Promise((resolve,reject)=>{
    concat(arr,toSrc + newFileName,(err)=>{
      if(err){
        reject(err);
      }
      resolve();
    })
  })
}




var total = 0;
app.post('/fileSize',(req,res)=>{
  // console.log(req.body);
  res.send({
    code: 200
  })
})

// 判断文件是否存在
const isFileExist = (filePath) => {
  return new Promise((resolve,reject) => {
    fs.access(filePath,(err) => {
      if(err) {
        reject(false);
      } 
      resolve(true);
    })
  })
}
const copyFile = (oldSrc,newSrc) => {
  fs.rename(oldSrc,newSrc,err =>{
    if(err) {
      // console.log(err);
      return
    } else {
    }
  }) 
}
// 创建存放分片的临时文件夹
const createDir = () => {
  const arr = ['a','b','c','d','e','f','g','1','2','3','4','6','9']
  let res = ''
  for(let i=0;i<10;i++){
    res += arr[parseInt(Math.random()*arr.length)]
  }
  let time = new Date().getTime().toString().substring(0,10)
  return `/${res}${time}`
}
// var dir = '/test10'
let dir = createDir();
app.post('/upload',(req,res)=>{
  try {
    var form = new formidable.IncomingForm({
      uploadDir: 'tmp'
    });
    form.parse(req, (err, fields, file) => {
      if(err){
        // console.log(err);
        return;
      }
      console.log(fields.filename);
      isFileExist(__dirname + '/uploads/' + fields.filename).then(()=>{
        res.send({
          code: 40010,
          msg: '上传完毕'
        })
        return;
      }).catch((e)=>{

      })
      let { total,idx} = fields;
      if(Number(idx) >= Number(total)) {
        res.send({
          code: 40010,
          msg: '上传完毕'
        })
        return;
      } 
      ensureDir(dir).then((data)=>{
        copyFile(file.data.path,__dirname + '/uploads/' + dir + '/' + idx)
        res.send({
          code: 200
        })
      })
    })
  } catch (error) {
    // console.log('是这里吗')
    // console.log(error)
  }
})
app.get('/merge',(req,res)=>{
  let filename = req.query.filename;
  // mergeFiles(__dirname + '/uploads/test10/',filename);
  ensureDir(dir).then(()=>{
    mergeFiles(`${__dirname}/uploads/`,filename).then(()=>{
      res.send({
        code: 200
      })
    }).catch((err)=>{
      console.log(err);
      res.send({
        code: 40001,
        msg: err
      })
      return;
    });
  })
  
  // console.log('mergeFiles结果',res);
  
})

app.listen(3003,()=>{console.log('express start at localhost:3003')})
// 列出文件夹下的文件
const listDir = (dir) => {
  // fs.readdir(dir,(err,data) => {
  //   if(err){
  //     reject(err)
  //   }
  //   return data;
  // })
  return new Promise((resolve,reject) => {
    fs.readdir(dir,(err,data) => {
      if(err){
        reject(err)
      }
      // console.log(data);
      
      // console.log(data);
      resolve(data);
    })
  })
}
// 创建文件夹
const ensureDir = (dir) => {
  return new Promise(async (resolve,reject) => {

    const src = `${__dirname}/uploads${dir}`

    let result = await fs.ensureDir(src).then(()=>{

    }).catch((e)=>{
      console.log('ensureDir出错');
      console.log(e);
    });
 
    resolve(true);
  })
}