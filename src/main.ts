import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './style.css'
import { getAnalytics } from './analytics'

getAnalytics()

createApp(App).use(createPinia()).use(router).mount('#app')
