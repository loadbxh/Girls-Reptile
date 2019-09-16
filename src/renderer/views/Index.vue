<template>
    <div>
        <div class="title-bar">
            <div class="title-menu">
                <Dropdown trigger='click' @on-click='onTitleMenuClick'>
                    <a href="javascript:void(0)">
                        GirlsReptile - {{ version }}
                        <Icon type="ios-arrow-down"></Icon>
                    </a>
                    <DropdownMenu slot="list">
                        <DropdownItem name='checkUpdate'>检查更新</DropdownItem>
                        <DropdownItem name='restart'>重启启动</DropdownItem>
                        <DropdownItem name='about'>关于我们</DropdownItem>
                    </DropdownMenu>
                </Dropdown>
            </div>
            <div class="handle-bar" v-if="os === 'win32'"> 
                <Icon type="md-remove" :size='16' color='#ff9900' @click="onTitleMenuClick('minsize')"/>
                <Icon type="md-close-circle" :size='16' color='#ed4014' @click="onTitleMenuClick('quit')"/>
            </div>
        </div>
        <div id="main">
        <div>
            <Row>
                <Col span='6'>
                        <RadioGroup v-model="model" type="button">
                        <Radio label="image">图片采集</Radio>
                        <Radio label="video" disabled>视频采集（开发中）</Radio>
                    </RadioGroup>
                </Col>
                <Col span='18'>
                    <div style="text-align:right">
                        <Tag type="dot" color="success">{{reptile.msgCurrent}}</Tag>
                    </div>
                </Col>
            </Row>
            </div>
            <Divider />
            <div>
                <Form ref="formInline" inline :label-width="80">
                    <FormItem label='采集源'>
                        <Select :disabled="loading" v-model="config.siteIndex" style="width:200px" @on-change="originSourceChange">
                            <Option :value="index" :key="index" v-for="(item,index) in originSource">{{ item.name }}</Option>
                        </Select>
                    </FormItem>
                    <FormItem label='图片分类' v-if="originSource.length>0">
                        <Select :disabled="loading" v-model="config.tagIndex" style="width:200px" @on-change="saveConfig">
                            <Option :value="index" :key="index" v-for="(item,index) in originSource[config.siteIndex].tags">{{ item.name }}</Option>
                        </Select>
                    </FormItem>
                    <FormItem label='采集延迟(ms)'>
                        <Slider style="width:200px;" :disabled="loading" @on-change="saveConfig" v-model="config.timeout"
                            :min='10' :max='2000' :step='10' show-tip='always' :tip-format='(value)=>{return `${value} ms`}'></Slider>
                    </FormItem>
                    <br>
                    <FormItem label='保存目录'>
                        <template>
                            <Input :value="config.saveDir" :disabled="loading" @on-search="selectSaveDir" style="width:300px" search enter-button placeholder="请选择保存目录" readonly />
                        </template>
                    </FormItem>
                    <FormItem label='区分目录'>
                        <template>
                            <i-switch :disabled="loading" @on-change="saveConfig" size="large" v-model='config.diffDirectory'>
                                <span slot="open">开启</span>
                                <span slot="close">关闭</span>
                            </i-switch>
                            <Button v-if="!loading" @click="getData" type="success" style="margin-left:10px"><Icon type="md-cloud-download" /> 立即进行自动采集</Button>
                            <Button v-else @click="stopRunning" type="error" style="margin-left:10px"><Icon type="md-close-circle" /> 立即停止采集</Button>
                            <Button @click="settingRS('show')" type="primary" style="margin-left:10px"><Icon type="md-cog" /> 设置采集源</Button>
                            <Button @click="getOriginSource(true)" style="margin-left:10px"><Icon type="md-cog" /> 同步采集源</Button>
                        </template>
                    </FormItem>
                </Form>
            </div>
            <Divider />
            <div>
                <div v-if="!loading && (!reptile.data || reptile.data.length==0) " style="width:100%;text-align:center">
                    <Icon type="md-clock" :size='100'/>
                    <p class="mt10">准备就绪，点击「立即进行自动采集」开始工作</p>
                </div>
                <div v-else-if="loading && (!reptile.data || reptile.data.length==0) " style="width:100%;text-align:center">
                    <Icon class="ivu-load-loop" type="md-refresh" :size='100'/>
                    <p class="mt10">页面分析中，稍等片刻就可以看到工作进度~</p>
                </div> 
                <div v-else id="records">
                    <template v-for="(item,index) in reptile.data" >
                        <Alert show-icon v-if="item.status==0">【准备就绪】{{item.name}}</Alert>
                        <Alert show-icon type="success" v-else-if="item.status==1">【采集成功】{{item.name}}</Alert>
                        <Alert show-icon type="warning" v-else-if="item.status==2">【采集异常】{{item.name}}</Alert>
                    </template>
                </div>
            </div>
        </div>
        <Modal title="关于我们" v-model="showAbout">
            <p class="fs14">软件名称：GirlsReptile</p>
            <p class="fs14">项目主页：<a @click="openUrl('https://github.com/Licoy/girls-reptile')">https://github.com/Licoy/girls-reptile</a></p>
            <p class="fs14">使用声明：此项目仅供学习交流使用，请勿使用于商业及非法用途，具体条款请参见于项目主页。</p>
        </Modal>
        <Modal title="采集源设置" v-model="setting.show" width="700px" :mask-closable='false' :closable='false'>
            <p style="font-size:12px">官方采集源：<a @click="openUrl('https://raw.githubusercontent.com/Licoy/girls-reptile/master/reptile-source.json')"
                >https://raw.githubusercontent.com/Licoy/girls-reptile/master/reptile-source.json</a></p>
            <br>
            <p style="font-size:12px">采集源规则：<a @click="openUrl('https://github.com/Licoy/girls-reptile/wiki/reptile-source-rules')"
            >https://github.com/Licoy/girls-reptile/wiki/reptile-source-rules</a></p>
            <br>
            <p style="font-size:12px">支持版本号：{{$reptileVersion}}（向下兼容）</p>
            <Divider />
            <Form :label-width='100'>
                <FormItem label='采集源地址：'>
                    <template>
                        <Input v-model="setting.tempRsUrl" :disabled="loading" placeholder="请输入采集源地址" />
                    </template>
                </FormItem>
            </Form>
            <div slot="footer" style="text-align:right">
                <Button @click="settingRS('close')">取消</Button>
                <Button type="primary" @click="settingRS('save')">确认更新</Button>
            </div>
        </Modal>
    </div>
</template>
<script>
import {remote,shell, os} from 'electron';
import getsMixins from '@/mixins/gets'
const {ipcRenderer} = require('electron');
import {version} from '../../../package.json';
export default {
    computed:{
        runningx() {
            return this.$store.state.Collect.running;
        }
    },
    watch: {
        runningx(newData, oldData) {
            this.loading = newData
        },
    },
    mixins:[getsMixins],
    async created(){
        this.version = version
        this.os = process.platform
        this.$store.commit('STOP')
        this.config = this.$db.get('config').value()
        this.saveConfig(true)
        await this.getOriginSource(false)
        ipcRenderer.on('download-success', (event, arg) => {
            this.reptile.data[arg.index].status = 1;
        })
        ipcRenderer.on('download-error', (event, arg) => {
            this.reptile.data[arg.index].status = 2;
        })
        ipcRenderer.on('download-list', (event, arg) => {
            this.reptile.data = arg.data;
        })
        ipcRenderer.on('download-current', (event, arg) => {
            this.reptile.msgCurrent = arg.msg;
        })
        ipcRenderer.on('sys-check-update', (event, arg) => {
            this.checkUpdate(true)
        })
        this.checkUpdate(false)
    },
    data(){
        return {
            version:'1.0.0',
            model:'image',
            os:null,
            loading:false,
            showAbout:false,
            originSource:[],
            reptile:{
                data:[],
                msgCurrent:'空闲中'
            },
            config:null,
            setting:{
                tempRsUrl:null,
                show:false
            }
        }
    },
    methods:{
        async getOriginSource(refresh=false){
            if(!this.$db.has('origins').value() || refresh===true){
                let load = this.$Message.loading({
                    content: '采集源站资源同步中...',
                    duration: 0
                });
                try {
                    let res = await this.$http.get(this.config.rsUrl);
                    let rs = []
                    res.data.forEach(element => {
                        if(element.supportReptileVersion <= this.$reptileVersion){
                            rs.push(element)
                        }
                    });
                    this.originSource = rs
                    this.config.siteIndex = 0
                    this.config.tagIndex = 0
                    this.saveConfig()
                    load()
                    this.$db.set('origins',rs).write()
                    this.$Message.success("采集源同步成功")
                } catch (error) {
                    load()
                    console.error(error)
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>采集源站资源加载失败，是否进行重新加载？</p><br><p>提示：如果您多次加载失败，请到Github项目主页提交issue。</p>',
                        onOk: () => {
                            this.getOriginSource(true)
                        }
                    });
                }
            }else{
                this.originSource = this.$db.get('origins').value()
            }
        },
        originSourceChange(val){
            this.config.tagIndex = 0
            this.saveConfig()
        },
        selectSaveDir(){
            const dialog = remote.dialog
            dialog.showOpenDialog({ properties: ['openDirectory'] }, (filename) => {
                if (filename&&filename.length === 1) {
                    this.config.saveDir = filename[0]
                    this.saveConfig()
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>更改下载目录需要重启后生效，是否立即重启？</p>',
                        onOk: () => {
                            remote.app.relaunch()
                            remote.app.quit()
                        }
                    });
                }
            })
        },
        openSaveDir(){
            if(this.config.saveDir==''){
                this.$notification.error({
                    message:'打开目录失败',
                    description: '暂未配置选择图片保存目录，无法进行快捷打开目录，请先配置选择之后再进行操作！'
                });
                return
            }
        },
        getData(){
            this.$store.commit('RUN');
            try{
                this.startReptile(this.originSource[this.config.siteIndex], this.config.tagIndex, this)
            }catch(e){
                this.$store.commit('STOP');
                this.$Message.error("采集出错")
            }
        },
        stopRunning(){
            this.$store.commit('STOP');
        },
        saveConfig(){
            this.$db.set('config',this.config).write()
            ipcRenderer.send('config-update', {})
            ipcRenderer.send('download-diff-dir-change', this.config.diffDirectory)
            this.$store.commit('TIMEOUT', this.config.timeout);
            this.$store.commit('DIFF_DIR', this.config.diffDirectory);
        },
        async checkUpdate(showLoading=true){
            const compareVersion2Update = (current, latest) => {
                const currentVersion = current.split('.').map(item => parseInt(item))
                const latestVersion = latest.split('.').map(item => parseInt(item))
                let flag = false
                for (let i = 0; i < 3; i++) {
                    if (currentVersion[i] < latestVersion[i]) {
                    flag = true
                    }
                }
                return flag
            }
            let load = () => {}
            if(showLoading){
                 load = this.$Message.loading({
                    content: '检查更新中',
                    duration: 0
                });
            }
            try {
                let res = await this.$http.get('https://api.github.com/repos/Licoy/girls-reptile/releases/latest')
                if(compareVersion2Update('v'+this.version,res.data.tag_name)){
                    load()
                    this.$Modal.confirm({
                        title: '提示',
                        content: '<p>检测到有新的版本'+res.data.tag_name+'，是否立即前往更新？</p>',
                        onOk: () => {
                            this.openUrl('https://github.com/Licoy/girls-reptile/releases')
                        }
                    });
                }else{
                    load()
                    if(showLoading){
                        this.$Message.success("当前已是最新版本！");
                    }
                }
            } catch (error) {
                load()
                if(showLoading){
                    this.$Message.error("获取版本信息失败");
                }
            }
        },
        onTitleMenuClick(name){
            if(name=='checkUpdate'){
                this.checkUpdate(true)
            }else if(name=='restart'){
                this.$Modal.confirm({
                    title: '提示',
                    content: '<p>是否确认重启？</p>',
                    onOk: () => {
                        remote.app.relaunch()
                        remote.app.quit()
                    }
                });
            }else if(name=='quit'){
                this.$Modal.confirm({
                    title: '提示',
                    content: '<p>是否确认退出？</p>',
                    onOk: () => {
                        remote.app.quit()
                    }
                });
            }else if(name=='about'){
                this.showAbout = true
            }else if(name=='minsize'){
                ipcRenderer.send('min', {})
            }
        },
        openUrl(url){
            shell.openExternal(url)
        },
        settingRS(mode){
            if(mode=='show'){
                this.setting = {
                    tempRsUrl: this.config.rsUrl,
                    show: true
                }
            }else if(mode=='close'){
                this.setting.show = false
            }else{
                this.config.rsUrl = this.setting.tempRsUrl
                this.saveConfig()
                this.setting.show = false
                this.getOriginSource(true)
            }
        }
    }
}
</script>
<style lang="scss">
    #main{
        padding:10px
    }
    .title-bar{
        -webkit-app-region: drag;
        text-align: center;
        height: 10px;
        padding:5px 0px 10px 0px;
        font-size: 14px;
    }
    .title-menu{
        cursor: pointer;
    }
    .fs14{
        font-size: 14px;
    }
    .handle-bar{
        -webkit-app-region: no-drag;
        position: fixed;
        top:2px;
        right:10px;
    }
    .mt10{
        margin-top:10px;
    }
    #records{
        height: 455px;
        overflow:scroll
    }
</style>