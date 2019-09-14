const state = {
    running: false,
    timeout: 10,
    diffDirectory: true
}

const mutations = {
    STOP (state) {
      state.running = false
    },
    RUN (state) {
      state.running = true
    },
    TIMEOUT(state, param){
        state.timeout = param
    },
    DIFF_DIR(state, param){
        state.diffDirectory = param
    }
}

const actions = {
    
  }

export default {
    state,
    mutations,
    actions
  }