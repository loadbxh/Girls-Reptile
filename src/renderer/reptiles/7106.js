import {get} from '@/config/axios'
import cheerio from 'cheerio'
const sleep = require('sleepjs')
const ipcRenderer = require('electron').ipcRenderer;

export default {
    baseUrl:'https://www.7160.com',
    tags:[
        {name:'性感美女', url: 'https://www.7160.com/rentiyishu/list_1_{page}.html'},
        {name:'美女明星', url: 'https://www.7160.com/meinvmingxing/list_5_{page}.html'},
        {name:'唯美图片', url: 'https://www.7160.com/weimeitupian/list_13_{page}.html'},
        {name:'清纯美女', url: 'https://www.7160.com/qingchunmeinv/list_2_{page}.html'},
        {name:'校园美女', url: 'https://www.7160.com/xiaohua/list_6_{page}.html'},
        {name:'靓丽车模', url: 'https://www.7160.com/lianglichemo/list_8_{page}.html'},
    ],
    async getPageData(url,vm,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        console.log(`开始采集第${page}页：${url}`)
        try {
            let res = await get(url,null,{page:page})
            let $ = cheerio.load(res.data)
            let newImgs = $(".new-img").find('li')
            let result = []
            if(newImgs.length>0){
                for(let i=0;i<newImgs.length;i++){
                    let a = $(newImgs[i]).find("a")
                    if(a){
                        let url = this.baseUrl+a.attr("href");
                        result.push({name:a.attr("title"),url:url,status:0})
                    } 
                }
            }
            if(!pageTotal){
                let pageLinks = $(".page").find("a")
                if(pageLinks.length>3){
                    let lastLink = pageLinks[pageLinks.length-1]
                    try {
                        pageTotal = parseInt($(lastLink).attr("href").split("_")[2].split(".")[0])
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
                if(currentUrl.indexOf("lianglichemo")==-1 && currentUrl.indexOf("xiaohua")==-1){
                    res = await get('{url}/index_{page}.html',null,{url:currentUrl,page:page});
                }else{
                    let s = currentUrl.split("/")
                    let id = (s[s.length-1].split("."))[0]
                    currentUrl = currentUrl.replace(id,`${id}_{page}`)
                    res = await get(currentUrl,null,{page:page});
                }
            }
            let $ = cheerio.load(res.data)
            if(!pageTotal){
                let pageLink = $(".itempage").find("a");
                if(pageLink && pageLink.length>3){
                    pageTotal = parseInt($(pageLink[pageLink.length-2]).text())
                }else{
                    pageTotal = page
                }
            }
            let image = $(".picsboxcenter").find('img')
            if(image && image.length>0){
                let link = $(image[0]).attr("src")
                ipcRenderer.send('download-button', {url:link,name:imgItem.name})
            }
            ipcRenderer.send('download-current', {msg:`第${gpage}页内「${imgItem.name}」第${page}图片抓取完成.`})
            if(page>=pageTotal){
                ipcRenderer.send('download-success', {index:index});
                if(gpage>=gpageTotal && index==length-1){
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