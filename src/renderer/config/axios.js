import axios from 'axios'
import { ResError } from './error/ResError';
import sf from 'string-format';
import Vue from 'vue';
import iView from 'iview';

const axiosInstance = axios.create({  
    baseURL: '',  
    timeout: 60000,
});
axiosInstance.interceptors.request.use(function (config) {
    return config;
  }, function (error) {
    return Promise.reject(error);
  })
axiosInstance.interceptors.response.use(res => {
    return res;
}, error => {
    console.error(error)
})

export const get = (url,params=null,pathVariable=null) =>  {
    let time = new Date().getTime()
    if(params==null){
        params = {
            request_time:time
        }
    }else{
        params.request_time = time
    }
    return axiosInstance.get(sf(url, pathVariable), {params:params})
}

export const post = (url,params,pathVariable=null) => axiosInstance.post(sf(url, pathVariable), params)

export const put = (url,params,pathVariable=null) => axiosInstance.put(sf(url, pathVariable), params)

export const patch = (url,params,pathVariable=null) => axiosInstance.patch(sf(url, pathVariable), params)

export const del = (url,params,pathVariable=null) => axiosInstance.delete(sf(url, pathVariable), {params:params})

Vue.prototype.$http = {
    get:get,
    post:post,
    put:put,
    patch:patch,
    del:del
}

export const errorHandler = (error, vm)=>{
    iView.Message.destroy()
    if(!(error instanceof ResError)){
        console.error(error)
    }else{
        iView.Message.error(error.message);
    }
}
  
Vue.config.errorHandler = errorHandler;
Vue.prototype.$throw = (error)=> errorHandler(error,this);