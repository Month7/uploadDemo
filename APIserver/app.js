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



let dir = ''
var total = 0;
app.post('/fileMd5',(req,res)=>{
  let { fileName,fileMd5 } = req.body;
  dir = '/' + fileMd5;
  isFileExist(__dirname + '/uploads/' + fileName).then(()=>{
    res.send({
      code: 40010,
      msg: '上传完毕'
    })
    return;
  }).catch((err)=>{
    
  })
  // 如果存放临时文件的文件夹存在,说明之前上传过但是未上传成功
  // 返回给客户端已经上传过的文件
  isFileExist(__dirname + '/uploads' + dir).then(()=>{
    listDir(__dirname + '/uploads' + dir).then((data)=>{
      res.send({
        code: 40001,
        msg: '之前已上传过',
        data: data
      })
      return;
    })
  }).catch((e)=>{
  })
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

// var dir = '/test10'

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
      // 如果文件已经存在 则直接上传完毕
      // isFileExist(__dirname + '/uploads/' + fields.filename).then(()=>{
      //   res.send({
      //     code: 40010,
      //     msg: '上传完毕'
      //   })
      //   return;
      // }).catch((e)=>{
      // })
      


      let { total,idx } = fields;
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
})


// 列出文件夹下的文件
const listDir = (dir) => {
  return new Promise((resolve,reject) => {
    fs.readdir(dir,(err,data) => {
      if(err){
        reject(err)
      }
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



app.listen(3003,()=>{console.log('express start at localhost:3003')})