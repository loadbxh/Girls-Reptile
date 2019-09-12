import {get} from '@/config/axios'
import cheerio from 'cheerio'
const sleep = require('sleepjs')
const ipcRenderer = require('electron').ipcRenderer;

export default {
    baseUrl:'https://www.meitulu.com',
    tags:[
        {name:'女神', url: 'https://www.meitulu.com/t/nvshen/'},
        {name:'极品', url: 'https://www.meitulu.com/t/jipin/'},
        {name:'嫩模', url: 'https://www.meitulu.com/t/nenmo/'},
        {name:'网红', url: 'https://www.meitulu.com/t/wangluohongren/'},
        {name:'气质', url: 'https://www.meitulu.com/t/qizhi/'},
        {name:'尤物', url: 'https://www.meitulu.com/t/youwu/'},
        {name:'爆乳', url: 'https://www.meitulu.com/t/baoru/'},
        {name:'性感', url: 'https://www.meitulu.com/t/xinggan/'},
        {name:'美胸', url: 'https://www.meitulu.com/t/meixiong/'},
        {name:'少妇', url: 'https://www.meitulu.com/t/shaofu/'},
        {name:'长腿', url: 'https://www.meitulu.com/t/changtui/'},
        {name:'萝莉', url: 'https://www.meitulu.com/t/loli/'},
        {name:'清纯', url: 'https://www.meitulu.com/t/qingchun/'},
        {name:'户外', url: 'https://www.meitulu.com/t/huwai/'},
    ],
    async getPageData(url,vm,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        console.log(`开始采集第${page}页：${url}`)
        try {
            let res = await get(url,null,{page:page})
            let $ = cheerio.load(res.data)
            let pcList = $(".boxs").find('.p_title')
            let result = []
            if(pcList.length>0){
                for(let i=0;i<pcList.length;i++){
                    let a = $(pcList[i]).find("a")
                    if(a){
                        let url = a.attr("href");
                        result.push({name:a.text(),url:url,status:0})
                    } 
                }
            }
            if(!pageTotal){
                let pageLinks = $("#pages").find("a")
                if(pageLinks.length>3){
                    let lastLink = pageLinks[pageLinks.length-2]
                    try {
                        pageTotal = parseInt($(lastLink).text())
                    } catch (error) {
                        console.error(error)
                        pageTotal = -1;
                    }
                }else{
                    pageTotal = -1;
                }
            }
            ipcRenderer.send('download-list', {data:result})
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                await this.getImages(element,i,result.length,vm,page,pageTotal)
            }
            await sleep(vm.$store.state.Collect.timeout)
            if(page<pageTotal){
                this.getPageData(url,vm,++page,pageTotal)
            }
        } catch (error) {
           console.log(error)
        }
    },
    async getImages(imgItem,index,length,vm,gpage,gpageTotal,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        try {
            let res = null;
            if(page==1){
                res = await get(imgItem.url,null)
            }else{
                let currentUrl = imgItem.url
                let s = currentUrl.split("/")
                let id = (s[s.length-1].split("."))[0]
                currentUrl = currentUrl.replace(id,`${id}_{page}`)
                res = await get(currentUrl,null,{page:page});
            }
            let $ = cheerio.load(res.data)
            if(!pageTotal){
                let pageLink = $("#pages").find("a");
                if(pageLink && pageLink.length>3){
                    pageTotal = parseInt($(pageLink[pageLink.length-2]).text())
                }else{
                    pageTotal = page
                }
            }
            let image = $(".content").find('.content_img')
            if(image && image.length>0){
                for (let image_index = 0; image_index < image.length; image_index++) {
                    const element = image[image_index];
                    let link = $(element).attr("src")
                    ipcRenderer.send('download-button', {url:link,name:imgItem.name,headers:[
                        {name:'Referer', value:imgItem.url}
                    ]})
                }
            }
            ipcRenderer.send('download-current', {msg:`第${gpage}页内「${imgItem.name}」第${page}图片抓取完成.`})
            if(page>=pageTotal){
                ipcRenderer.send('download-success', {index:index});
                if(gpage>=gpageTotal && index==length-1){
                    console.log(gpage, gpageTotal)
                    vm.$store.commit('STOP');
                }
                return;
            }
            this.getImages(imgItem,index,length,vm,gpage,pageTotal,++page);
        } catch (error) {
            ipcRenderer.send('download-error', {index:index})
            console.log(error)
        }
    }
}