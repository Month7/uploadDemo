<template>
  <div class="container">
      <div class="body" >
        <input type="file" ref="file">
        <z-button @click="upload" type="primary">上传文件</z-button>
        <z-button @click="pause" type="warn">{{pauseTxt}}</z-button>
        <div class="process2">
          <span>上传文件进度 {{process}} % </span>
        </div>
      </div>
  </div>
</template>
<script>
import SparkMD5 from 'spark-md5'
export default {
  name: 'Upload',
  data(){
    return {
      file: null,
      spark: new SparkMD5.ArrayBuffer(),
      fileReader: new FileReader(),
      process: 0,
      pauseTxt: '暂停',
      pauseFlag: true,
      pauseData: {
        idx: null,
        count: null,
        file: null,
        fileSize: null,
        chunkSize: null
      }
    }
  },
  mounted(){
    const fileDom = this.$refs.file;
    fileDom.addEventListener('change',()=>{
      console.log('fileDom change!')
      this.process = 0;
      this.pauseFlag = true;
      this.pauseTxt = '暂停'
    })
  },
  methods: {
    // md5加密 规则 文件名称
    md5File(file){
      var spark = new SparkMD5();
      console.log(file);
      spark.append(file.name)
      return spark.end()
    },

    // 校验md5
    // checkMd5(fileName,fileMd5Value){
    //   this.$http({
    //     url: 'http://localhost:3003/checkMd5',
    //     method: 'post',
    //     data: {
    //       fileName: fileName,
    //       fileDom: fileMd5Value
    //     }
    //   }).then((res)=>{
    //     console.log(res);
    //   })
    // },
    // 上传
    upload(){
      const fileDom = this.$refs.file;
      if(fileDom.files.length == 0) {
        alert('您还未选择任何文件!');
        return;
      }
      let file = fileDom.files[0];
      console.log(file);
      const fileMd5 = this.md5File(file);
      console.log('fileMd5',fileMd5);
      const fileSize = file.size; // 文件大小
      const chunkSize =  1024 * 1024;  // 分块大小
      const count = Math.ceil(fileSize / chunkSize); // 切成的片数
      // 先传文件名和文件名md5
      this.$http({
        url: 'http://localhost:3003/fileMd5',
        method: 'post',
        data: {
          fileName: file.name,
          fileMd5: fileMd5
        }
      }).then(( res )=>{
        if(res.data && res.data.code === 200) {
          this.sliceUpload(0,count,fileSize,file,chunkSize)
        } else if(res.data && res.data.code === 40001) { // 之前已经上传过
          this.sliceUpload(0,count,fileSize,file,chunkSize,res.data.data)
        }
      })
    },
    // 分片上传
    sliceUpload(idx,count,fileSize,file,chunkSize,existArr = []){
      let end = (idx + 1) > count? count : idx + 1;
      let sliceFile = file.slice(idx * chunkSize,end * chunkSize);
      let form = new FormData();
      form.append("total",count);
      form.append("idx",idx);
      form.append("data",sliceFile);
      form.append("filename",file.name)
      console.log(idx.toString())
      console.log(existArr)
      console.log(existArr.indexOf(idx.toString()))
      if(existArr.indexOf(idx.toString()) === -1) {   // 未上传过该分片
        this.$http({
        url: 'http://localhost:3003/upload',
        method: 'post',
        data: form
        }).then((res)=>{
          this.process = Math.floor(idx/count *100);
          if(res.data.code === 40001) {
            return;
          }
          if(res.data.code === 40010 ) {
            this.$http({
              url: `http://localhost:3003/merge?filename=${file.name}`,
            }).then((res)=> {
              if(res.data.code === 200) {
                this.process = 100;
              } else {
                this.process = 99;   // 合并失败 进度条99 恶心人
              }
            })
            return;
          }
          if(this.pauseFlag) {
            // console.log(existArr.indexOf(idx+1))
            this.sliceUpload(idx+1,count,fileSize,file,chunkSize,existArr);
          } else {
            this.pauseData = {
              idx: idx + 1,
              count: count,
              fileSize: fileSize,
              file: file,
              chunkSize: chunkSize,
              existArr: existArr
            }
          }
        }).catch((err)=>{        // 发生断网等意外
          console.log('err',err);
          this.pauseData = {
            idx: idx,
            count: count,
            fileSize: fileSize,
            file: file,
            chunkSize: chunkSize,
            existArr: existArr
          }
          this.pause();
        })
      } else {
        this.sliceUpload(idx+1,count,fileSize,file,chunkSize,existArr);
      }
    },
    // 暂停/继续 上传
    pause(){
      if(this.pauseFlag){
        this.pauseTxt = '继续';
        this.pauseFlag = false;
      } else {
        const { idx,count,fileSize,file,chunkSize,existArr } = this.pauseData;
        this.sliceUpload(idx,count,fileSize,file,chunkSize,existArr)
        this.pauseData = {};
        this.pauseTxt = '暂停';
        this.pauseFlag = true;
      }
    },
  }
}
</script>
<style>
.container{
  display: flex;
  justify-content: center;
}
.body{
  display: flex;
  align-items: center;
}
</style>
