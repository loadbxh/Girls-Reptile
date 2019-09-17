import {get} from "@/config/axios"
import cheerio from "cheerio"
const sleep = require("sleepjs")
const ipcRenderer = require("electron").ipcRenderer;
import sf from 'string-format';

export default {
    async getPageData(mode,tagIndex,vm,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        let url = mode.tags[tagIndex].url
        try {
            let goUrl = page==1 ? url : this.getNextPage(url, mode.pages.nextPageUrlMode)
            console.log(`开始采集第${page}页：${goUrl}`)
            let res = await get(goUrl,null,{page:page})
            let $ = cheerio.load(res.data)
            let pcList = $(mode.pages.element)
            let result = []
            if(pcList && pcList.length>0){
                for(let i=0;i<pcList.length;i++){
                    let url , name = null;
                    url = this.getAttr($(pcList[i]).find(mode.pages.url.element),mode.pages.url.attr)
                    if(url){
                        if(mode.pages.url.needMerge){
                            url = mode.url + url
                        }
                    }
                    name = this.getAttr($(pcList[i]).find(mode.pages.name.element),mode.pages.name.attr)
                    if(url && name){
                        result.push({name:name,url:url,status:0})
                    }else{
                        console.error("get url or name fail! : " + url)
                    }
                }
            }
            if(!pageTotal){
                pageTotal = this.getLastPage($, mode.pages.lastPage)
            }
            ipcRenderer.send("download-list", {data:result})
            for (let i = 0; i < result.length; i++) {
                const element = result[i];
                await this.getImages(mode,element,i,result.length,vm,page,pageTotal)
            }
            await sleep(vm.$store.state.Collect.timeout)
            if(page<pageTotal){
                this.getPageData(mode,tagIndex,vm,++page,pageTotal)
            }
        } catch (error) {
           console.log(error)
        }
    },
    async getImages(mode,imgItem,index,length,vm,gpage,gpageTotal,page=1,pageTotal=null){
        if(!vm.$store.state.Collect.running){
            return;
        }
        try {
            const singlePage = mode.imgs.singlePage ? mode.imgs.singlePage : false
            const urlNeedMerge = mode.imgs.urlNeedMerge ? mode.imgs.urlNeedMerge : false
            let incrementMode = mode.imgs.nextPageUrlMode.incrementMode ? mode.imgs.nextPageUrlMode.incrementMode : 'page'
            let imageSuffix = mode.imgs.nextPageUrlMode.imageSuffix ? mode.imgs.nextPageUrlMode.imageSuffix : 'jpg'
            let goUrl = page==1 ? imgItem.url : this.getNextPage(imgItem.url, mode.imgs.nextPageUrlMode)
            const referer = sf(goUrl, {page:page})
            let res = await get(goUrl,null,{page:page})
            let $ = cheerio.load(res.data)
            if(!pageTotal){
                pageTotal = this.getLastPage($, mode.imgs.lastPage)
            }
            let images = $(mode.imgs.element)
            if(images && images.length>0){
                const imageAttr = mode.imgs.attr ? mode.imgs.attr : 'src'
                if(incrementMode=='image'){
                    const element = images[0]
                    let link = this.getAttr($(element),imageAttr)
                    for (let linkIndex = 1; linkIndex <= pageTotal; linkIndex++) {
                        let currentLink = link
                        if(linkIndex>1){
                            currentLink = link.replace("1."+imageSuffix, linkIndex+"."+imageSuffix)
                        }
                        if(urlNeedMerge){
                            currentLink = mode.url + currentLink
                        }
                        ipcRenderer.send("download-button", {url:currentLink,name:imgItem.name,headers:[
                            {name:"Referer", value: referer},
                        ]})
                    }
                }else{
                    for (let image_index = 0; image_index < images.length; image_index++) {
                        const element = images[image_index]
                        let link = this.getAttr($(element),imageAttr)
                        if(urlNeedMerge){
                            link = mode.url + link
                        }
                        ipcRenderer.send("download-button", {url:link,name:imgItem.name,headers:[
                            {name:"Referer", value: referer},
                            {name:"User-Agent", value:"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.181 Safari/537.36"}
                        ]})
                    }
                }
            }
            ipcRenderer.send("download-current", {msg:`第${gpage}页内「${imgItem.name}」第${page}图片已提交下载队列`})
            if(page>=pageTotal || incrementMode=='image'){
                ipcRenderer.send("download-success", {index:index});
                if(gpage>=gpageTotal && index==length-1){
                    console.log(gpage, gpageTotal)
                    vm.$store.commit("STOP");
                }
                return;
            }
            if(!singlePage){
                this.getImages(mode,imgItem,index,length,vm,gpage,pageTotal,++page);
            }
        } catch (error) {
            ipcRenderer.send("download-error", {index:index})
            console.log(error)
        }
    },
    getAttr(element, attr){
        try {
            if(attr!='@text'){
                return element.attr(attr)
            }
            return element.text()
        } catch (error) {
            console.error("attr is undefined : " + attr)
            console.error(error)
            return false
        }
    },
    getLastPage($,lastPageMode){
        let pageTotal = -1
        let pageLinks = $(lastPageMode.element)
        if(pageLinks.length>=lastPageMode.minPageLength){
            let lastLink = pageLinks[pageLinks.length-lastPageMode.descIndex]
            try {
                let pageTotalUrl = this.getAttr($(lastLink),lastPageMode.attr)
                if(pageTotalUrl){
                    if(lastPageMode.isNeedSplit && lastPageMode.splits && lastPageMode.splits.length>0){
                        for (let sIndex = 0; sIndex < lastPageMode.splits.length; sIndex++) {
                            const sResult = lastPageMode.splits[sIndex];
                            pageTotalUrl = pageTotalUrl.split(sResult.str)[sResult.index]
                        }
                    }
                    try {
                        pageTotal = parseInt(pageTotalUrl)
                        if(isNaN(pageTotal)){
                            pageTotal = -1
                        }
                    } catch (error) {
                        console.error("conversion page count failed")
                        console.log(error)
                    }
                }
            } catch (error) {
                console.error(error)
            }
        }
        return pageTotal;
    },
    getNextPage(url, nextPageUrlMode){
        if(nextPageUrlMode.mode=='replace'){
            return url.replace(nextPageUrlMode.replaceSearchValue, nextPageUrlMode.replaceValue)
        }
        return url + nextPageUrlMode.addValue
    }
}