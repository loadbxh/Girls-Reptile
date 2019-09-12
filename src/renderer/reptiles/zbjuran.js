import {get} from '@/config/axios'
import cheerio from 'cheerio'
const sleep = require('sleepjs')
const ipcRenderer = require('electron').ipcRenderer;

export default {
    baseUrl:'https://www.zbjuran.net',
    tags:[
        {name:'清纯美女', url: 'https://www.zbjuran.net/mei/qingchun/list_14_{page}.html'},
        {name:'性感美女', url: 'https://www.zbjuran.net/mei/xinggan/list_13_{page}.html'},
        {name:'明星写真', url: 'https://www.zbjuran.net/mei/mingxing/list_16_{page}.html'},
        {name:'美女校花', url: 'https://www.zbjuran.net/mei/xiaohua/list_15_{page}.html'},
    ],
    async getPageData(url,vm,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        console.log(`开始采集第${page}页：${url}`)
        try {
            let res = await get(url,null,{page:page})
            let $ = cheerio.load(res.data)
            let pcList = $(".pic-list").find('.name')
            let result = []
            if(pcList.length>0){
                for(let i=0;i<pcList.length;i++){
                    let a = $(pcList[i]).find("a")
                    if(a){
                        let url = this.baseUrl+a.attr("href");
                        result.push({name:a.attr("title"),url:url,status:0})
                    } 
                }
            }
            if(!pageTotal){
                let pageLinks = $(".pages").find("a")
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
                let s = currentUrl.split("/")
                let id = (s[s.length-1].split("."))[0]
                currentUrl = currentUrl.replace(id,`${id}_{page}`)
                res = await get(currentUrl,null,{page:page});
            }
            let $ = cheerio.load(res.data)
            if(!pageTotal){
                let pageLink = $(".page").find("a");
                if(pageLink && pageLink.length>3){
                    pageTotal = parseInt($(pageLink[pageLink.length-2]).text())
                }else{
                    pageTotal = page
                }
            }
            let image = $(".picbox").find('img')
            if(image && image.length>0){
                let link = $(image[0]).attr("src")
                console.log(link,imgItem.url)
                ipcRenderer.send('download-button', {url:link,name:imgItem.name,headers:[
                    {name:'Referer', value:imgItem.url}
                ]})
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