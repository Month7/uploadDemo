const express = require('express');
// const multipart = require('connect-multiparty'); // form-data 格式的中间件支持
const path = require('path')
// const multipartMiddleware = multipart();
const formidable = require('formidable')
const bodyParser = require('body-parser') 
const concat = require('concat-files')
const fs = require('fs')
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


var total = 0;
app.post('/fileSize',(req,res)=>{
  console.log(req.body);
  res.send({
    code: 200
  })
})
const copyFile = (oldSrc,newSrc) => {
  fs.rename(oldSrc,newSrc,err =>{
    if(err) {
      console.log(err);
      return
    } else {
      console.log('拷贝完成');
    }
    
  }) 
}
app.post('/upload',(req,res)=>{
  try {
    var form = new formidable.IncomingForm({
      uploadDir: 'tmp'
    });
    form.parse(req, (err, fields, file) => {
      if(err){
        console.log(err);
        return;
      }
      let { total,idx} = fields;
      if(Number(idx) > Number(total)) {
        res.send({
          code: 40010,
          msg: '上传完毕'
        })
        return;
      } 
      // console.log(file.data.path)
      // console.log(__dirname);
      // console.log(file);
      copyFile(file.data.path,__dirname + '/uploads/' + file.data.name + idx)
      res.send({
        code: 200
      })
    })
  } catch (error) {
    console.log(error)
  }

})

app.listen(3003,()=>{console.log('express start at localhost:3003')})