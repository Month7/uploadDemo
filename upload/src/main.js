import Vue from 'vue'
import App from './App.vue'
import axios from 'axios'
import zhengUi from 'zheng-ui'
import 'zheng-ui/dist/zheng-ui.css'

Vue.use(zhengUi)


Vue.prototype.$http = axios;

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')
