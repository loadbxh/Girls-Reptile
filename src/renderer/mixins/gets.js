import reptiles from '@/reptiles/index'
export default{
    data() {
    },
    methods: {
        startReptile(mode, tagIndex, vm){
            reptiles.getPageData(mode,tagIndex,vm)
        }
    },

}