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
                <Col span='12'>
                        <RadioGroup v-model="model" type="button">
                        <Radio label="image">图片采集</Radio>
                        <Radio label="video" disabled>视频采集（开发中）</Radio>
                    </RadioGroup>
                </Col>
                <Col span='12'>
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
                    <FormItem label='图片分类'>
                        <Select :disabled="loading" v-model="config.tagIndex" style="width:200px" @on-change="saveConfig">
                            <Option :value="index" :key="index" v-for="(item,index) in reptile.origin.tags">{{ item.name }}</Option>
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
                    <FormItem>
                        <template>
                            <!-- <i-switch :disabled="loading" @on-change="saveConfig" size="large" v-model='config.autoCollect'>
                                <span slot="open">开启</span>
                                <span slot="close">关闭</span>
                            </i-switch> -->
                            <Button v-if="!loading" @click="getData" type="success">立即进行自动采集</Button>
                            <Button v-else @click="stopRunning" type="error" style="margin-left:10px">立即停止采集</Button>
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
            <p class="fs14">项目主页：<a @click="openUrl('https://github.com/Licoy/GirlsReptile')">https://github.com/Licoy/GirlsReptile</a></p>
            <p class="fs14">使用声明：此项目仅供学习交流使用，请勿使用于商业及非法用途，具体条款请参见于项目主页。</p>
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
    created(){
        this.version = version
        this.os = process.platform
        this.$store.commit('STOP');
        this.config = this.$db.get('config').value()
        this.reptile.origin = this.getSourceTags(this.originSource[this.config.siteIndex].key)
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
            this.checkUpdate()
        })
    },
    data(){
        return {
            version:'1.0',
            model:'image',
            os:null,
            loading:false,
            showAbout:false,
            originSource:[
                {name:'7106',key:'7106',url:'https://www.7160.com/'},
                {name:'美图录',key:'meitulu',url:'https://www.meitulu.com/'},
                {name:'zbjuran',key:'zbjuran',url:'https://www.zbjuran.net/mei/'},
            ],
            reptile:{
                origin:{
                    tags:[]
                },
                data:[],
                msgCurrent:'空闲中'
            },
            columns:[
                { title: '采集名称', width:380, dataIndex: 'name', key: 'name'},
                { title: '链接地址', width:380, dataIndex: 'url', key: 'url'},
                { title: '操作', width:200, dataIndex: '', key: 'x', scopedSlots: { customRender: 'action' }}
            ],
            config:null
        }
    },
    methods:{
        originSourceChange(val){
            this.config.tagIndex = 0
            this.reptile.origin = this.getSourceTags(this.originSource[this.config.siteIndex].key)
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
                this.reptile.origin.getPageData(this.reptile.origin.tags[this.config.tagIndex].url, this)
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
            this.$store.commit('TIMEOUT', this.config.timeout);
        },
        checkUpdate(){
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
            const load = this.$Message.loading({
                content: '检查更新中',
                duration: 0
            });
            setTimeout(()=>{
                load()
                this.$Message.success("当前已是最新版本！")
            }, 3000);
        },
        onTitleMenuClick(name){
            if(name=='checkUpdate'){
                this.checkUpdate()
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