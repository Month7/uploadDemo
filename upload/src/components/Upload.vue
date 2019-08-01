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
    // md5加密 规则 修改时间+文件名称+最后修改时间
    // md5File(file){
    //   return new Promise((resolve,reject)=> {
    //     this.fileReader.onload = (e) => {
    //       this.spark.append(e.target.result);
    //       resolve(this.spark.end())
    //     }
    //   })
    // },

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
    async upload(){
      const fileDom = this.$refs.file;
      if(fileDom.files.length == 0) {
        alert('您还未选择任何文件!');
        return;
      }
      let file = fileDom.files[0];
      const fileSize = file.size; // 文件大小
      const chunkSize =  1024 * 1024;  // 分块大小
      const count = Math.ceil(fileSize / chunkSize); // 切成的片数
      this.$http({
        url: 'http://localhost:3003/fileSize',
        method: 'post',
        data: count
      }).then(( res )=>{
        if(res.data && res.data.code === 200)
          this.sliceUpload(0,count,fileSize,file,chunkSize)
      })
    },
    // 分片上传
    sliceUpload(idx,count,fileSize,file,chunkSize){
      let end = idx+1>count? count : idx+1;
      let sliceFile = file.slice(idx * chunkSize,end * chunkSize);
      let form = new FormData();
      form.append("total",count);
      form.append("idx",idx);
      form.append("data",sliceFile);
      form.append("filename",file.name)
      this.$http({
        url: 'http://localhost:3003/upload',
        method: 'post',
        data: form
      }).then((res)=>{
        this.process = Math.floor(idx/count *100);
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
          this.sliceUpload(idx+1,count,fileSize,file,chunkSize); 
        } else {
          this.pauseData = {
            idx: idx + 1,
            count: count,
            fileSize: fileSize,
            file: file,
            chunkSize: chunkSize
          }
        }
        
      }).catch((err)=>{        // 发生断网等意外
        console.log('err',err);
        this.pauseData = {
          idx: idx,
          count: count,
          fileSize: fileSize,
          file: file,
          chunkSize: chunkSize
        }
        this.pause();
      })
    },
    // 暂停/继续 上传
    pause(){
      if(this.pauseFlag){
        this.pauseTxt = '继续';
        this.pauseFlag = false;
      } else {
        const {idx,count,fileSize,file,chunkSize } = this.pauseData;
        this.sliceUpload(idx,count,fileSize,file,chunkSize)
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
