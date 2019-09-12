import g_7106 from '@/reptiles/7106'
import g_zbjuran from '@/reptiles/zbjuran'
import g_meitulu from '@/reptiles/meitulu'
export default{
    data() {
    },
    methods: {
        getSourceTags(key){
            if(key=='7106'){
                return g_7106;
            }
            if(key=='zbjuran'){
                return g_zbjuran;
            }
            if(key=='meitulu'){
                return g_meitulu;
            }
           return [];
        }
    },

}